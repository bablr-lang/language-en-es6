import { spam as m, re } from '@bablr/boot';
import { buildString } from '@bablr/helpers/builders';
import { defineAttribute, eat, eatMatch, fail, match, o } from '@bablr/helpers/grammar';

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
    *TemplateString({ s }) {
      let tagged = !!s.held;
      if (tagged) {
        yield eat(m`tag+$: <_Expression />`, o({ power: 3 }));
        yield eat(
          m`openToken*: <*Punctuator '\u0060' { balanced: '\u0060', balancedSpan: 'String:TaggedTemplate' } />`,
        );
      } else {
        yield eat(m`tag+$: null`);
        yield eat(
          m`openToken*: <*Punctuator '\u0060' { balanced: '\u0060', balancedSpan: 'String:Template' } />`,
        );
      }

      let interp;
      let first = true;

      while (
        (first || interp) &&
        (yield eat(m`quasis[]*: <*StringContent />`)) &&
        (interp = yield eatMatch(m`interpolations[]$: <StringInterpolation '\u0024{' />`))
      );

      yield eat(m`closeToken*: <*Punctuator '\u0060' { balancer: true } />`);
    }

    *StringContent({ state: { span } }) {
      let esc, lit;
      do {
        lit =
          span === 'String:Single'
            ? yield eatMatch(re`/[^\r\n\\']+/`)
            : span === 'String:Double'
            ? yield eatMatch(re`/[^\r\n\\"]+/`)
            : span === 'String:Template'
            ? yield eatMatch(re`/(?:[^$\\\u0060]|\$[^{])+/`)
            : span === 'String:TaggedTemplate'
            ? yield eatMatch(re`/(?:[^$\\\u0060]|\\[$]|[$][^{]|[$]$)+/`)
            : yield fail();
        esc =
          (yield eatMatch(m`@: <EscapeSequence '\\' />`)) ||
          (span === 'String:TaggedTemplate' && (yield eatMatch('\\')));
      } while (esc || lit);
    }

    *StringInterpolation() {
      yield eat(
        m`openToken*: <*Punctuator ${buildString('${')} {
          balanced: '}',
          balancedSpan: 'Bare'
        } />`,
      );

      yield eat(m`value+$: <_Expression />`);

      yield eat(m`openToken*: <*Punctuator '}' { balancer: true } />`);
    }

    *EscapeSequence(args) {
      let { s, ctx } = args;
      let _match, cooked;
      if (s.span === 'String:Template') {
        yield eat(m`escape*: <*Punctuator '\\' { openSpan: 'Escape' } />`);

        if ((_match = yield match(re`/[\\/bfnrt0\u0060]/`))) {
          const match_ = ctx.sourceTextFor(_match);
          yield eat(m`code*: <*Keyword ${buildString(match_)} { closeSpan: 'Escape' } />`);
          cooked = escapables.get(match_) || match_;
        } else {
          let code = yield eat(m`code*: <EscapeCode { closeSpan: 'Escape' } />`);

          cooked = String.fromCodePoint(parseInt(ctx.sourceTextFor(code.get('value')), 16));
        }
        yield defineAttribute('cooked', cooked);
      } else if (s.span === 'String:TaggedTemplate') {
        yield eat(m`escape*: <*Punctuator '\\' { openSpan: 'Escape' } />`);

        yield eat(m`code*: <*Keyword '\u0060' { closeSpan: 'Escape' } />`);
        cooked = '`';

        yield defineAttribute('cooked', cooked);
      } else {
        yield* super.EscapeSequence(args);
      }
    }
  };

export default mixin;
