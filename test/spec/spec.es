import {expect} from 'chai';
import outdent from '../../lib/index';

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
        expect(outdent`
            Hello
            World
            
        `).to.equal('Hello\nWorld\n');
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

    it('Preserves trailing spaces on blank lines', () => {
        expect(outdent`
            Hello
              
            World
        `).to.equal('Hello\n  \nWorld');
    });

    it('Handles empty strings', () => {
        expect(outdent`

        `).to.equal('');
    });
    
    it('Gets indentation level from first interpolated value being a reference to outdent', () => {
        function doIt(outdent) {
            expect(outdent`
                ${outdent}
                    Some text
            `).to.equal('    Some text');
            expect(outdent`
                ${outdent}
            12345678
            `).to.equal('5678');
        }
        
        doIt(outdent);
        doIt(outdent({someOptions: true}));
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
        expect(customOutdent`
        
        `).to.equal('\n\n');
        
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
            const strings = ['\n    Hello\n    world\n'.replace(/\n/g, terminator)];
            const expected = 'Hello\nworld'.replace(/\n/g, terminator);
            strings.raw = strings;
            expect(outdent(strings)).to.equal(expected);
        });
    });

});
