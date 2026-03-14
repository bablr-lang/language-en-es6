import { freeze } from '@bablr/agast-helpers/object';
import { printSource } from '@bablr/agast-helpers/tree';
import { re, spam as m } from '@bablr/boot';
import { buildString } from '@bablr/helpers/builders';
import {
  defineAttribute,
  eat,
  eatMatch,
  endSpan,
  fail,
  match,
  startSpan,
} from '@bablr/helpers/grammar';
import ES5Regex from '@bablr/language-en-es5/regex';

export const canonicalURL = 'https://bablr.org/languages/core/universe/es3-regex-pattern';

export const dependencies = {};

export const defaultMatcher = m`<Pattern />`;

const flagCharacters = freeze({
  global: 'g',
  ignoreCase: 'i',
  multiline: 'm',
  unicode: 'u',
  sticky: 'y',
});

const grammar = class ES6Regex extends ES5Regex.grammar {
  static get flagCharacters() {
    return flagCharacters;
  }

  *EscapeCode() {
    if (yield match('x')) {
      yield eatMatch(m`typeToken*: <*Keyword 'x' />`);
      yield eat(m`value: <*UnsignedHexInteger /[\da-fA-F]{2}/ />`);
    } else if (yield match('u')) {
      yield eatMatch(m`typeToken*: <*Keyword 'u' />`);
      if (yield eatMatch(m`openToken*: <* '{' />`)) {
        yield startSpan('EscapeCode', '}');
        yield eat(m`value: <*UnsignedHexInteger />`);
        yield endSpan();
        yield eat(m`closeToken*: <* '}' />`);
      } else {
        yield eat(m`value: <*UnsignedHexInteger /[\da-fA-F]{4}/ />`);
      }
    } else {
      yield fail();
    }
  }
};

export default { canonicalURL, dependencies, grammar, defaultMatcher };
