import { expect } from 'chai';
import * as Path from 'path';
import * as webpack from 'webpack';
import outdent from '../..';

describe('Code bundlers', () => {
    describe('Webpack', () => {
        it('bundles outdent', async () => {
            await new Promise((res, rej) => {
                webpack({
                    context: Path.join(__dirname, '../fixture/webpack-project'),
                    entry: './entry',
                    output: {
                        libraryTarget: 'commonjs',
                        path: Path.join(__dirname, '../fixture/webpack-project'),
                    },
                    mode: 'development',
                    devtool: false,
                    target: 'node',
                    resolve: {
                        alias: {
                            outdent: Path.join(__dirname, '..', '..'),
                        },
                    },
                }, (err, stats) => {
                    if(err || stats.hasErrors() || stats.hasWarnings()) {
                        const info = stats.toJson();
                        rej(err || new Error(JSON.stringify(info.errors.length ? info.errors : info.warnings)));
                    } else {
                        res();
                    }
                });
            });
            expect(require('../fixture/webpack-project/main').default).to.eq('Webpack output');
        }).timeout(4000);
    });
});
