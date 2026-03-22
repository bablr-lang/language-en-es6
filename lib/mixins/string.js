import { get, printSource } from '@bablr/agast-helpers/tree';
import { spam as m, re } from '@bablr/boot';
import { buildString } from '@bablr/helpers/builders';
import {
  defineAttribute,
  eat,
  eatMatch,
  endSpan,
  fail,
  match,
  o,
  startSpan,
} from '@bablr/helpers/grammar';

export const escapables = Object.freeze({
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
  0: '\0',
  '\\': '\\',
  '/': '/',
});

const mixin = (Base) =>
  class ES6StringGrammar extends Base {
    *TemplateString({ getState }) {
      let s = getState();
      let tagged = !!s.shifted;
      if (tagged) {
        yield eat(m`tag+$: <_Expression />`, o({}), o({ held: 'eat' }));
        yield eat(m`openToken*: <* '\u0060' />`);
        yield startSpan('String:TaggedTemplate', '`');
      } else {
        yield eat(m`openToken*: <* '\u0060' />`);
        yield startSpan('String:Template', '`');
        yield eat(m`tag+$: null`);
      }

      let interp;
      let first = true;

      while (
        (first || interp) &&
        (yield eat(m`quasis[]*: <*StringContent />`)) &&
        (interp = yield eatMatch(m`interpolations[]$: <StringInterpolation '\u0024{' />`))
      );

      yield eat(m`closeToken*: <* '\u0060' />`);
      yield endSpan();
    }

    *StringContent({ s }) {
      let { span } = s();
      let esc, lit;
      do {
        lit =
          span.name === 'String:Single'
            ? yield eatMatch(re`/[^\r\n\\']+/`)
            : span.name === 'String:Double'
            ? yield eatMatch(re`/[^\r\n\\"]+/`)
            : span.name === 'String:Template'
            ? yield eatMatch(re`/(?:[^$\\\u0060]|\$[^{])+/`)
            : span.name === 'String:TaggedTemplate'
            ? yield eatMatch(re`/(?:[^$\\\u0060]|\\[$]|\\[^\u0060]|[$][^{]|[$]$)+/`)
            : yield fail();
        esc =
          span.name === 'String:TaggedTemplate'
            ? yield eatMatch(m`@: <EscapeSequence '\\\u0060' />`)
            : yield eatMatch(m`@: <EscapeSequence '\\' />`);
      } while (esc || lit);
    }

    *StringInterpolation() {
      yield eat(m`openToken*: <* '\u0024{' />`);
      yield startSpan('Bare', '}');
      yield eat(m`value+$: <_Expression />`);
      yield endSpan();
      yield eat(m`closeToken*: <* '}' />`);
    }

    *EscapeSequence(args) {
      let { getState } = args;
      let s = getState();
      let _match, cooked;

      if (s.span.name === 'String:Template') {
        yield startSpan('Escape');
        yield eat(m`escape*: <* '\\' />`);

        if ((_match = yield match(re`/[\\/bfnrt0\u0060]/`))) {
          const match_ = printSource(_match);
          yield eat(m`code*: <*Keyword ${buildString(match_)} />`);
          cooked = escapables[match_] || match_;
        } else {
          let code = yield eat(m`code*: <EscapeCode />`);

          cooked = String.fromCodePoint(parseInt(printSource(get('value', code.node)), 16));
        }
        yield defineAttribute('cooked', cooked);
        yield endSpan();
      } else if (s.span.name === 'String:TaggedTemplate') {
        yield startSpan('Escape');
        yield eat(m`escape*: <* '\\' />`);

        yield eat(m`code*: <*Keyword '\u0060' />`);
        cooked = '`';

        yield endSpan();
        yield defineAttribute('cooked', cooked);
      } else {
        yield* super.EscapeSequence(args);
      }
    }
  };

export default mixin;
