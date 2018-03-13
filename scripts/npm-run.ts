import * as fs from 'fs';
import * as rimraf from 'rimraf';
import * as child_process from 'child_process';
import * as which from 'which';
import * as Path from 'path';

async function run(script: string) {
    console.log(`${ Path.relative(process.cwd(), __filename) }: Running "${ script }"`);
    if(!allScripts.some(v => v === script)) throw new Error(`Unexpected npm lifecycle event: ${ script }`);
    await runners[script]();
}

const runners = {
    async clean() {
        rimraf.sync('node_modules');
        rimraf.sync('lib');
        rimraf.sync('lib-module');
    },
    async build() {
        exec`tsc --project ./tsconfig-lib.json`;
        exec`tsc --project ./tsconfig-module.json`;
    },
    async test() {
        await run('build');
        exec`mocha`;
        exec`tsc --project test/ts`;
        await run('lint');
    },
    async lint() {
        // Pass globs directly to tslint, avoiding shell expansion.
        exec`tslint --config ./tslint-lib.json --project ./tsconfig-lib.json `;
        exec`tslint --config ./tslint-test.json --project ./tsconfig-test.json --exclude src/**/*`;
        exec`tsfmt --baseDir . --useTsconfig ./tsconfig-test.json --verify`;
    },
    async format() {
        // Pass globs directly to tslint, avoiding shell expansion.
        exec`tsfmt --replace src/**/*.ts test/**/*.ts`;
    },
    async prepack() {
        /*
            * Make extra-sure that we are producing a clean, valid package for publishing or otherwise.
            * Force a full clean, reinstall of deps, rebuild, and run tests.
            */
        await run('clean');
        exec`npm install`;
        await run('test');
    },
    async setup() {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.scripts = {};
        allScripts.forEach(script => {
            pkg.scripts[script] = 'ts-node -F -P ./scripts/tsconfig.json ./scripts/npm-run.ts';
        });
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, '  '));
    },
};

const allScripts = Object.keys(runners);

async function main() {
    console.log(process.env);
    const script = process.env.npm_lifecycle_event;
    await run(script!);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});


// TODO publish this as a separate NPM module
function exec(strings: TemplateStringsArray, ...values: Array<string>): void {
    return doTmpl(strings, ...values);
    function doTmpl(strings: TemplateStringsArray, ...values: Array<string | boolean | null | undefined>): void {
        const cmd: Array<string> = [];
        const acc: Array<{ type: 'whitespace' | 'literal' | 'interp', val?: any }> = [];
        for(let i = 0; i < strings.length; i++) {
            strings[i].split(/\s+/).forEach((v, i2, l) => {
                // Ignore leading and trailing whitespace in the template
                if(v === '' && ((i === 0 && i2 === 0) || (i === strings.length - 1 && i2 === l.length - 1))) return;
                acc.push({ type: 'literal', val: v });
                if(i2 < l.length - 1) {
                    acc.push({ type: 'whitespace' });
                }
            });
            if(i < strings.length - 1) {
                acc.push({ type: 'interp', val: values[i] });
            }
        }
        let cmdIndex = 0;
        let prevTokType: 'whitespace' | 'notWhitespace' | undefined = undefined;
        for(let tok of acc) {
            if(tok.type === 'whitespace' && prevTokType !== 'whitespace') {
                prevTokType = 'whitespace';
                ++cmdIndex;
            } else {
                // Pretend that 'null', 'undefined', and 'false' interpolations don't exist
                if(tok.type === 'interp') {
                    if(tok.val == null || tok.val === false) continue;
                }
                prevTokType = 'notWhitespace';
                if(cmd[cmdIndex] == null) cmd[cmdIndex] = '';
                cmd[cmdIndex] += tok.val;
            }
        }
        console.log(`> ${ cmd.join(' ') }`);
        const env = {};
        while(/.=/.test(cmd[0])) {
            const [, name, value] = cmd.shift()!.match(/^([\s\S]*?)=(.*)$/)!;
            env[name] = value;
        }
        const executable = which.sync(cmd[0]);
        const args = cmd.slice(1);
        const result = child_process.spawnSync(executable, args, {
            stdio: 'inherit',
            env: { ...process.env, ...env }
        });
        if(result.status !== 0) throw new Error('Process returned non-zero exit status.');
    }
}
