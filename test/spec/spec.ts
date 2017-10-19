import {expect} from 'chai';
import outdent from '../../lib/index';

function makeStrings(...strings: string[]): TemplateStringsArray {
    (strings as any as {raw: ReadonlyArray<string>}).raw = strings;
    return strings as any as TemplateStringsArray;
}

describe('outdent', () => {

    it('Removes indentation', () => {
        expect(outdent`
            Hello
            World
        `).to.equal('Hello\nWorld');
    });

    it('Preserves indentation of lines that are extra-indented', () => {
        expect(outdent`
            Hello
              World
                !!!!
        `).to.equal('Hello\n  World\n    !!!!');
    });

    it('Preserves extra leading newlines', () => {
        expect(outdent`

            Hello
            World
        `).to.equal('\nHello\nWorld');
    });

    it('Preserves extra trailing newlines', () => {
        // tslint:disable no-trailing-whitespace
        expect(outdent`
            Hello
            World
            
        `).to.equal('Hello\nWorld\n');
        // tslint:enable no-trailing-whitespace
    });

    it('Removes non-whitespace characters if they\'re in indentation columns', () => {
        expect(outdent`
                           Hello
   (this text is removed)  World
        `).to.equal('Hello\nWorld');
    });

    it('Accepts blank lines with no characters, not even indentation whitespace', () => {
        expect(outdent`
            Hello

            World
        `).to.equal('Hello\n\nWorld');
    });

    it('Accepts lines shorter than indentation whitespace', () => {
        expect(outdent`
            Hello
removed
            World
        `).to.equal('Hello\n\nWorld');

        // tslint:disable no-trailing-whitespace
        expect(outdent`
            Hello
     
            World
        `).to.equal('Hello\n\nWorld');
        // tslint:enable no-trailing-whitespace
    });

    it('Preserves trailing spaces on blank lines', () => {
        // tslint:disable no-trailing-whitespace
        expect(outdent`
            Hello
              
            World
        `).to.equal('Hello\n  \nWorld');
        // tslint:enable no-trailing-whitespace
    });

    it('Handles empty strings', () => {
        expect(outdent`

        `).to.equal('');
    });

    it('Gets indentation level from first interpolated value being a reference to outdent', () => {
        function doIt(tag) {
            expect(tag`
                ${tag}
                    Some text
            `).to.equal('    Some text');

            expect(tag`
                ${tag}
            12345678
            `).to.equal('5678');

            expect(tag`

                ${tag}
            12345678
            `).to.equal('5678');
        }

        const configuredOutdentInstance = outdent({trimLeadingNewline: true});
        expect(configuredOutdentInstance).to.not.equal(outdent);

        doIt(outdent);
        doIt(configuredOutdentInstance);
    });
    it('Does not get indentation level from outdent when preceded by non-whitespace or with trailing characters on the same line', () => { // tslint:disable-line:max-line-length
        const toString = '' + outdent;

        expect(outdent `non-whitespace
                  ${outdent}
                  Hello world!
                  `).to.equal(`non-whitespace\n${toString}\nHello world!`);

        expect(outdent `
               foo${outdent}
                  Hello world!
                  `).to.equal(`foo${toString}\n   Hello world!`);

        expect(outdent `
            ${outdent}foo
            Hello world!
        `).to.equal(`${toString}foo\nHello world!`);

        expect(outdent(makeStrings(
            '\n' +
            '    ', /* interpolated */ '   \n' +
            '    Hello world!\n' +
            '    '
        ), outdent)).to.equal(`${toString}   \nHello world!`);

        expect(outdent `
            foo
            ${outdent}
            Hello world!
        `).to.equal(`foo\n${toString}\nHello world!`);
    });

    it('Does not trim leading newline when asked not to', () => {
        expect(outdent({
            trimLeadingNewline: false
        })`
            Hello
            World
        `).to.equal('\nHello\nWorld');
    });
    it('Does not trim trailing newline when asked not to', () => {
        expect(outdent({
            trimTrailingNewline: false
        })`
            Hello
            World
        `).to.equal('Hello\nWorld\n');

    });
    it('Does not trim trailing nor leading newline when asked not to', () => {
        expect(outdent({
            trimLeadingNewline: false,
            trimTrailingNewline: false
        })`
            Hello
            World
        `).to.equal('\nHello\nWorld\n');

        expect(outdent({
            trimLeadingNewline: false,
            trimTrailingNewline: false
        })`
        `).to.equal('\n');

        expect(outdent({
            trimLeadingNewline: false,
            trimTrailingNewline: false
        })`

        `).to.equal('\n\n');
    });

    it('Merges options objects', () => {
        const customOutdent = outdent({trimLeadingNewline: false})({trimTrailingNewline: false});

        // tslint:disable no-trailing-whitespace
        expect(customOutdent`
        
        `).to.equal('\n\n');
        // tslint:enable no-trailing-whitespace

        expect(customOutdent({trimLeadingNewline: true})`
            Hi
        `).to.equal('Hi\n');
    });

    [
        ['Unix', '\n'],
        ['Windows', '\r\n'],
        ['Mac', '\r']
    ].forEach(([type, terminator]) => {
        it(`Handles ${type} newlines`, () => {
            const strings = makeStrings('\n    Hello\n    world\n'.replace(/\n/g, terminator));
            const expected = 'Hello\nworld'.replace(/\n/g, terminator);
            expect(outdent(strings)).to.equal(expected);
        });
    });

    it('Preserves content that appears before the first newline, detecting indentation from the second line', () => {
        expect(outdent `Hello
                        world!
                        `).to.equal('Hello\nworld!');
    });

    it('Accepts strings with no newlines', () => {
        expect(outdent `Hello world!`).to.equal('Hello world!');
    });

    it('Accepts strings with no content after the first newline', () => {
        expect(outdent `Hello world!
        `).to.equal('Hello world!');
    });
});
