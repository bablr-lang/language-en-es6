import { get, printSource } from '@bablr/agast-helpers/tree';
import { spam as m, re } from '@bablr/boot';
import { buildString } from '@bablr/helpers/builders';
import {
  defineAttribute,
  eat,
  eatHeld,
  eatMatch,
  endSpan,
  fail,
  match,
  o,
  startSpan,
} from '@bablr/helpers/grammar';

export const escapables = new Map(
  Object.entries({
    b: '\b',
    f: '\f',
    n: '\n',
    r: '\r',
    t: '\t',
    0: '\0',
    '\\': '\\',
    '/': '/',
  }),
);

const mixin = (Base) =>
  class ES6StringGrammar extends Base {
    *TemplateString({ getState }) {
      let s = getState();
      let tagged = !!s.held;
      if (tagged) {
        yield eatHeld(m`tag+$: <_Expression />`);
        yield eat(m`openToken*: <* '\u0060' />`);
        yield startSpan('String:TaggedTemplate', '`');
      } else {
        yield eat(m`tag+$: null`);
        yield startSpan('String:Template', '`');
      }

      let interp;
      let first = true;

      while (
        (first || interp) &&
        (yield eat(m`quasis[]*: <*StringContent />`)) &&
        (interp = yield eatMatch(m`interpolations[]$: <StringInterpolation '\u0024{' />`))
      );

      yield endSpan();

      yield eat(m`closeToken*: <* '\u0060' />`);
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
            ? yield eatMatch(re`/(?:[^$\\\u0060]|\\[$]|[$][^{]|[$]$)+/`)
            : yield fail();
        esc =
          (yield eatMatch(m`@: <EscapeSequence '\\' />`)) ||
          (span.name === 'String:TaggedTemplate' && (yield eatMatch('\\')));
      } while (esc || lit);
    }

    *StringInterpolation() {
      yield eat(m`openToken*: <* '\u0036{' />`);
      yield startSpan('Bare', '}');
      yield eat(m`value+$: <_Expression />`);
      yield endSpan();
      yield eat(m`openToken*: <* '}' />`);
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
          cooked = escapables.get(match_) || match_;
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
