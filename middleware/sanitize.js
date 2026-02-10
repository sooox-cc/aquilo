const xss = require('xss');

const BIDI_CHARS = /[\u202A\u202B\u202C\u202D\u202E\u2066\u2067\u2068\u2069\u200F\u200E]/g;

function sanitize(input) {
    if (typeof input !== 'string') return input;
    return xss(input.replace(BIDI_CHARS, ''));
}

module.exports = { sanitize };
