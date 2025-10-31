import { spam as m, re } from '@bablr/boot';
import { buildString } from '@bablr/helpers/builders';
import { eat, eatMatch, match } from '@bablr/helpers/grammar';

let templMatcher;

export const mixin = (Base) =>
  class ES6StringGrammar extends Base {
    *TemplateString() {
      yield eat(
        m`openToken*: <*Punctuator ${buildString('`')} { balanced: ${buildString(
          '`',
        )}, balancedSpan: 'String:Template' } />`,
      );

      let interp;
      let first = true;

      while (
        (first || interp) &&
        (yield eat(m`quasis[]*: <*StringContent />`)) &&
        (interp = yield eatMatch(m`interpolations[]$: <StringInterpolation />`))
      );

      yield eat(m`closeToken*: <*Punctuator ${buildString('`')} { balancer: true } />`);
    }

    *StringContent({ state: { span } }) {
      let esc, lit;
      do {
        esc = (yield match('\\')) && (yield eat(m`@: <EscapeSequence />`));
        lit =
          span === 'String:Single'
            ? yield eatMatch(re`/[^\r\n\\']+/`)
            : span === 'String:Double'
            ? yield eatMatch(re`/[^\r\n\\"]+/`)
            : yield (templMatcher ??= eatMatch(
                re`/(?:[^$\\${re.Character({
                  raw: ['`'],
                })}]|\$[^{])+/`,
              ));
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
  };
