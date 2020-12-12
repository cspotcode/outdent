#!/usr/bin/env ts-node-script
import * as fs from "fs-extra";
import { sync as spawnSync } from "execa";
import * as Path from "path";

async function run(script: string) {
  console.log(
    `${Path.relative(process.cwd(), __filename)}: Running "${script}"`,
  );
  if (!allScripts.some((v) => v === script)) {
    throw new Error(`Unexpected lifecycle event: ${script}`);
  }
  await runners[script]();
}

const runners = {
  async clean() {
    fs.rmdirSync("lib");
    fs.rmdirSync("lib-module");
    fs.rmdirSync("tsconfig-lib.tsbuildinfo");
    fs.rmdirSync("tsconfig-module.tsbuildinfo");
  },
  async build() {
    exec`tsc --build ./tsconfig-build.json`;
  },
  async test() {
    await run("build");
    exec`mocha`;
    exec`tsc --project test/ts`;
    await run("lint");
  },
  formattedFiles:
    `scripts src test --ignore test/fixture/webpack-project/main.js`.split(" "),
  async lint() {
    // Pass globs directly to tslint, avoiding shell expansion.
    exec`deno fmt --check ${this.formattedFiles}`;
  },
  async format() {
    exec`deno fmt ${this.formattedFiles}`;
  },
  async prepack() {
    /*
     * Make extra-sure that we are producing a clean, valid package for publishing or otherwise.
     * Force a full clean, reinstall of deps, rebuild, and run tests.
     */
    exec`yarn`;
    await run("clean");
    await run("test");
  },
  async setup() {
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
    pkg.scripts = {};
    allScripts.forEach((script) => {
      pkg.scripts[script] = "ts-node-script ./scripts/npm-run.ts";
    });
    fs.writeFileSync("package.json", JSON.stringify(pkg, null, "  "));
  },
};

const allScripts = Object.keys(runners);

async function main() {
  const script = process.env.npm_lifecycle_event;
  await run(script!);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

// TODO publish this as a separate NPM module
function exec(strings: TemplateStringsArray, ...values: Array<string>): void {
  return doTmpl(strings, ...values);
  function doTmpl(
    strings: TemplateStringsArray,
    ...values: Array<string | boolean | null | undefined>
  ): void {
    const cmd: Array<string> = [];
    const acc: Array<{ type: "whitespace" | "literal" | "interp"; val?: any }> =
      [];
    for (let i = 0; i < strings.length; i++) {
      strings[i].split(/\s+/).forEach((v, i2, l) => {
        // Ignore leading and trailing whitespace in the template
        if (
          v === "" &&
          ((i === 0 && i2 === 0) ||
            (i === strings.length - 1 && i2 === l.length - 1))
        ) {
          return;
        }
        acc.push({ type: "literal", val: v });
        if (i2 < l.length - 1) {
          acc.push({ type: "whitespace" });
        }
      });
      if (i < strings.length - 1) {
        acc.push({ type: "interp", val: values[i] });
      }
    }
    let cmdIndex = 0;
    let prevTokType: "whitespace" | "notWhitespace" | undefined = undefined;
    for (let tok of acc) {
      if (tok.type === "whitespace" && prevTokType !== "whitespace") {
        prevTokType = "whitespace";
        ++cmdIndex;
      } else {
        const vals = Array.isArray(tok.val) ? tok.val : [tok.val];
        let first = true;
        for (const val of vals) {
          // Pretend that 'null', 'undefined', and 'false' interpolations don't exist
          if (tok.type === "interp") {
            if (val == null || val === false) continue;
          }
          prevTokType = "notWhitespace";
          if (cmd[cmdIndex] == null) cmd[cmdIndex] = "";
          if (!first) ++cmdIndex;
          cmd[cmdIndex] += val;
          first = false;
        }
      }
    }
    console.log(`> ${cmd.join(" ")}`);
    const env = {};
    while (/.=/.test(cmd[0])) {
      const [, name, value] = cmd.shift()!.match(/^([\s\S]*?)=(.*)$/)!;
      env[name] = value;
    }
    const executable = cmd[0];
    const args = cmd.slice(1);
    const result = spawnSync(executable, args, {
      stdio: "inherit",
      env: { ...process.env, ...env },
    });
    if (result.exitCode !== 0) {
      throw new Error("Process returned non-zero exit status.");
    }
  }
}
