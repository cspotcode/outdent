// This file is meant to be compiled but not executed.  It tests our type declarations.

import alsoOutdent from '../../';
import { Options, outdent, Outdent } from '../../';

let s: string;
s = outdent`
    foo bar`;
s = alsoOutdent`
    baz biff`;
const newOutdent1 = outdent({ trimLeadingNewline: false, trimTrailingNewline: true });
const newOutdent2 = newOutdent1({ trimLeadingNewline: false });
s = newOutdent2`
    hello ${ 123 } world`;
const outdent2: Outdent = newOutdent2;
