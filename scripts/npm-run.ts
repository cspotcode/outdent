/* tslint:disable no-console no-unused-expression */

import * as child_process from 'child_process';
import * as Path from 'path';
import * as rimraf from 'rimraf';
import * as which from 'which';

async function run(script: string) {
    console.log(`${ Path.relative(process.cwd(), __filename) } > ${ script }`);
    switch(script) {
        case 'clean':
            rimraf.sync('node_modules');
            rimraf.sync('lib');
            rimraf.sync('lib-module');
            break;

        case 'build':
            exec `tsc -p .`;
            exec `tsc -p ./tsconfig-module.json`;
            break;

        case 'test':
            await run('build');
            exec `mocha`;
            exec `tsc -p test/ts`;
            break;

        case 'prepack':
            /*
             * Make extra-sure that we are producing a clean, valid package for publishing or otherwise.
             * Force a full clean, reinstall of deps, rebuild, and run tests.
             */
            await run('clean');
            exec `npm install`;
            await run('test');
            break;

        default:
            throw new Error(`Unexpected npm lifecycle event: ${ script }`);
    }
}

async function main() {
    const script = process.env.NPM_LIFECYCLE_EVENT;
    await run(script!);
}

main();

// TODO publish this as a separate NPM module
function exec(strings: TemplateStringsArray, ...values: string[]): void {
    return doTmpl(strings, ...values);
    // tslint:disable-next-line no-shadowed-variable
    function doTmpl(strings: TemplateStringsArray, ...values: Array<string | boolean | null | undefined>): void {
        const cmd: string[] = [];
        const acc: Array<{type: 'whitespace' | 'literal' | 'interp', val?: any}> = [];
        for(let i = 0; i < strings.length; i++) {
            strings[i].split(/\s+/).forEach((v, i2, l) => {
                // Ignore leading and trailing whitespace in the template
                if(v === '' && ((i === 0 && i2 === 0) || (i === strings.length - 1 && i2 === l.length - 1))) return;
                acc.push({type: 'literal', val: v});
                if(i2 < l.length - 1) {
                    acc.push({type: 'whitespace'});
                }
            });
            if(i < strings.length - 1) {
                acc.push({type: 'interp', val: values[i]});
            }
        }
        let cmdIndex = 0;
        let prevTokType: 'whitespace' | 'notWhitespace' | undefined;
        for(const tok of acc) {
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
            env: {...process.env, ...env}
        });
        if(result.status !== 0) throw new Error('Process returned non-zero exit status.');
    }
}
