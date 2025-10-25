import { spam as m, re } from '@bablr/boot';
import { buildString } from '@bablr/helpers/builders';
import { eat, eatMatch, match } from '@bablr/helpers/grammar';

export const mixin = (Base) =>
  class ES6StringGrammar extends Base {
    *TemplateString() {
      yield eat(
        m`openToken*: <*Punctuator ${buildString('`')} { balanced: ${buildString(
          '`',
        )}, balancedSpan: 'String:Template' } />`,
      );

      yield eat(m`content*: <*StringContent />`);

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
            : yield eatMatch(
                re`/[^\\${re.Character({
                  raw: ['`'],
                })}]+/`,
              );
      } while (esc || lit);
    }
  };
