# outdent

## Removing leading indentation from ES6 template strings

ES6 template strings are great, but they preserve everything between the backticks, including leading spaces.
Sometimes I want to indent my template literals to make my code more readable without including all those spaces in the
string.

Outdent will remove those leading spaces, as well as the leading and trailing newlines.

    import outdent from 'outdent';
    const markdown = outdent`
        # My Markdown File

        Here is some indented code:

            console.log("hello world!");
    `;
    console.log(markdown);
    fs.writeFileSync('output.md', markdown);

The contents of `output.md` do not have the leading indentation:

    # My Markdown File

    Here is some indented code:

        console.log("hello world!");

As a Javascript string:

    var markdown = '# My Markdown File\n' +
        '\n' +
        'Here is some indented code:'
        '\n' +
        '    console.log("hello world!");'

You can pass options to outdent to control its behavior.  They are explained in [Options](#Options).

    const output = outdent({trimLeadingNewline: false, trimTrailingNewline: false})`
        Hello world!
    `;
    assert(output === '\nHello world!\n');
    
You can explicitly specify the indentation level by passing `outdent` as the first interpolated value.  Its position
sets the indentation level and it is removed from the output.

    const output = outdent`
          ${outdent}
            Yo
        12345
              Hello world
    `;
    assert(output === '  Yo\n345\n    Hello world');

### Options

#### `trimLeadingNewline`
*Default: true*

#### `trimTrailingNewline`
*Default: true*

Whether or not outdent should remove the leading and/or trailing newline from your template string.  For example:

    var s = outdent({trimLeadingNewline: false})`
        Hello
    `;
    assert(s === '\nHello');
    s = outdent({trimTrailingNewline: false})`
        Hello
    `
    assert(s === 'Hello\n');
    s = outdent({trimLeadingNewline: false, trimTrailingNewline: false})`
        
    `;
    assert(s === '\n\n');

<!--
#### `pass`

Returns an arguments array that can be passed to another tagging function, instead of returning a string.

For example, say you want to use outdent with the following code:

    function query(barVal) {
        return prepareSql`
    SELECT * from foo where bar = ${barVal}
        `;
    }

`prepareSql` is expecting to receive a strings array and all interpolated values so that it can create a safe SQL
query.  To add outdent into the mix, we
must set `pass: true` and splat the result into `prepareSql`.

    var odRaw = outdent({pass: true});
    function query(barVal) {
        return prepareSql(...odRaw`
            SELECT * from foo where bar = ${barVal}
        `);
    }

*This is a contrived example because SQL servers don't care about indentation.  But perhaps the result is
being logged and looks better without indentation?  Perhaps you're doing something totally different with tagged
template strings? Regardless, the `pass` option is here in case you need it. :-)*

-->

### Gotchas

You must start the contents of your template string on a new line *after* the opening backtick.  Otherwise, outdent
has no way to detect how much leading indentation to remove.

    // Bad
    const output = outdent`Hello
        world
    `;
    // Good
    const output = outdent`
        Hello
        world
    `;

Spaces and tabs are treated identically.  outdent does not verify that you are using spaces or tabs consistently; they
are all treated as a single character for the purpose of removing indentation.  Spaces, tabs, and smart tabs should
all work correctly provided you use them consistently.

<!--
### TODOs

[ ] Support tabs and/or smart tabs (verify they're being used correctly?  Throw an error if not?)
-->
