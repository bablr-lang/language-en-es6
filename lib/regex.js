import { freeze, freezeClass, freezeRecord } from '@bablr/agast-helpers/object';
import { m, eat, eatMatch, endSpan, fail, match, startSpan } from '@bablr/helpers/grammar';
import ES5Regex from '@bablr/language-en-es5/regex';

export default class ES6Regex extends ES5Regex {
  static canonicalURL = 'https://bablr.org/languages/core/universe/en/es6-regex-pattern';
  static dependencies = freeze({});
  static defaultMatcher = m`<Pattern />`;
  static fragmentProduction = 'Fragment';
  static context = freezeRecord({
    flagCharacters: freezeRecord({
      ...super.flagCharacters,
      unicode: 'u',
      sticky: 'y',
    }),
  });

  *EscapeCode({ s }) {
    let { span } = s();
    if (span.name !== 'Pattern') yield fail();
    if (yield match(m`'x'`)) {
      yield eatMatch(m`typeToken*: <*Keyword 'x' />`);
      yield eat(m`value: <*UnsignedHexInteger /[\da-fA-F]{2}/ />`);
    } else if (yield match(m`'u'`)) {
      yield eatMatch(m`typeToken*: <*Keyword 'u' />`);
      if (span.props.flags.includes('u') && (yield eatMatch(m`openToken*: <* '{' />`))) {
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
}

freezeClass(ES6Regex);
