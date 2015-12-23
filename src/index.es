// In the absence of a WeakSet or WeakMap implementation, don't break, but don't cache either.
function noop() {}
function createWeakMap() {
    if(typeof WeakMap !== 'undefined') {
        return new WeakMap();
    } else {
        return fakeSetOrMap();
    }
}
function fakeSetOrMap() {
    return {
        add: noop,
        delete: noop,
        set: noop,
        has: function() {return false;}
    };
}

// Safe hasOwnProperty
const hop = Object.prototype.hasOwnProperty;
const has = function(obj, prop) {
    return hop.call(obj, prop);
};

// Copy all own enumerable properties from source to target
function extend(target, source) {
    for(let prop in source) {
        if(has(source, prop)) {
            target[prop] = source[prop];
        }
    }
    return target;
}

const reLeadingNewline = /^[ \t]*(?:\r\n|\r|\n)/;
const reTrailingNewline = /(?:\r\n|\r|\n)[ \t]*$/;

function _outdent(strings, values, outdentInstance, options) {
    // If first interpolated value is a reference to outdent,
    // determine indentation level from the indentation of the interpolated value.
    let indentationLevel;
    let leadingTrim;
    let firstStringIndex = 0;

    const match = strings[0].match(/(\r\n|\r|\n)([ \t]*)(?:[^ \t\r\n]|$)/);
    if(!match) throw new Error('TODO');
    leadingTrim = match.index + match[1].length;
    indentationLevel = match[2].length;

    let reSource = `(\\r\\n|\\r|\\n).{0,${indentationLevel}}`;
    const reMatchIndent = new RegExp(reSource, 'g');

    if(values[0] === outdentInstance || values[0] === outdent) {
        values = values.slice(1);
        strings = strings.slice(1);
        firstStringIndex = 1;
    }

    const l = strings.length;
    const outdentedStrings = strings.map((v, i) => {
        // Remove leading indentation from all lines
        v = v.replace(reMatchIndent, '$1');
        // Trim a leading newline from the first string
        if(i === 0 && options.trimLeadingNewline) {
            v = v.replace(reLeadingNewline, '');
        }
        // Trim a trailing newline from the last string
        if(i === l - 1 && options.trimTrailingNewline) {
            v = v.replace(reTrailingNewline, '');
        }
        return v;
    });
    
    return concatStringsAndValues(outdentedStrings, values);
}

function concatStringsAndValues(strings, values) {
    let ret = '';
    for(let i = 0, l = strings.length; i < l; i++) {
        ret += strings[i];
        if(i < l - 1) {
            ret += values[i];
        }
    }
    return ret;
}

/**
 * It is assumed that opts will not change.  If this is a problem, clone your options object and pass the clone to
 * makeInstance
 * @param options
 * @return {outdent}
 */
function makeInstance(options) {
    const cache = new createWeakMap();

    const ret = function outdent(stringsOrOptions, ...values) {
        if(has(stringsOrOptions, 'raw') && has(stringsOrOptions, 'length')) {
            // TODO Enable semi-caching, both when the first interpolated value is `outdent`, and when it's not
            const strings = stringsOrOptions;
            // Serve from cache only if there are no interpolated values
            if(values.length === 0 && cache.has(strings)) return cache.get(strings);

            // Perform outdentation
            const rendered = _outdent(strings, values, ret, options);

            // Store into the cache only if there are no interpolated values
            values.length === 0 && cache.set(strings, rendered);
            return rendered;
        } else {
            // Create and return a new instance of outdent with the given options
            return makeInstance(extend(extend({}, options), stringsOrOptions));
        }
    };

    return ret;
}

const outdent = makeInstance({
    trimLeadingNewline: true,
    trimTrailingNewline: true
});

// ES6
outdent.default = outdent;
outdent.__esModule = true;
exports.default = outdent;
exports.__esModule = true;
module.exports = outdent;
