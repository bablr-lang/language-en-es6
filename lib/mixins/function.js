import {
  o,
  m,
  r,
  eat,
  eatMatch,
  match,
  shiftMatch,
  startSpan,
  endSpan,
  fail,
  startSubspan,
} from '@bablr/helpers/grammar';
import { reservedWords } from '@bablr/language-en-es5';
import { List } from '@bablr/helpers/productions';
import { printSource } from '@bablr/agast-helpers/tree';
import { freeze } from '@bablr/agast-helpers/object';

let reservedWords_ = new Set(reservedWords);

const mixin = (Base) => {
  class ES6FunctionGrammar extends Base {
    *FunctionExpression({ props: { shorthand } }) {
      yield eatMatch(m`asyncToken*: <*Keyword 'async' />`);
      if (!shorthand) {
        yield eat(m`sigilToken*: <*Keyword 'function' />`);
      }
      yield eatMatch(m`starToken*: <* '*' />`);

      if (!shorthand) {
        yield eatMatch(m`name$: <Identifier />`, o({}), o({ bind: true }));
      } else {
        yield eat(m`name$: null`);
      }

      yield eat(m`openParamsToken*: <* '(' />`);
      yield startSpan('Bare', ')');
      let sep, it;
      for (;;) {
        if ((it = yield eatMatch(m`params[]+$: <_CapturePattern />`))) {
        } else {
          it = yield eatMatch(m`params[]+$: <SpreadPattern '...' />`);
        }
        if (it) {
          sep = yield eatMatch(m`#separatorTokens: <* ',' />`);
        } else {
          sep = null;
        }
        if (!sep) break;
      }
      yield endSpan();
      yield eat(m`closeParamsToken*: <* ')' />`);
      yield eat(m`body$: <Block />`);
    }

    *FunctionDeclaration() {
      yield eatMatch(m`asyncToken*: <*Keyword 'async' />`);
      yield eat(m`sigilToken*: <*Keyword 'function' />`);
      yield eatMatch(m`starToken*: <* '*' />`);

      yield eat(m`name$: <Identifier />`, o({}), o({ bind: true }));

      yield eat(m`openParamsToken*: <* '(' />`);
      yield startSpan('Bare', ')');
      let sep, it;
      for (;;) {
        if ((it = yield eatMatch(m`params[]+$: <_CapturePattern />`))) {
        } else {
          it = yield eatMatch(m`params[]+$: <SpreadPattern '...' />`);
        }
        if (it) {
          sep = yield eatMatch(m`#separatorTokens: <* ',' />`);
        } else {
          sep = null;
        }
        if (!sep) break;
      }
      yield endSpan();
      yield eat(m`closeParamsToken*: <* ')' />`);
      yield eat(m`body$: <Block />`);
    }

    *YieldExpression() {
      yield eat(m`sigilToken*: <*Keyword 'yield' />`);
      yield eatMatch(m`starToken*: <* '*' />`);
      yield eat(m`expression+$: <_Expression />`);
    }

    *AwaitExpression() {
      yield eat(m`sigilToken*: <*Keyword 'await' />`);
      yield eat(m`expression+$: <_Expression />`);
    }

    *CapturePattern() {
      let pn;

      if ((pn = yield match(m`/[[{]/`))) {
        switch (printSource(pn).trim()) {
          case '{':
            yield eat(m`<ObjectPattern />`);
            break;
          case '[':
            yield eat(m`<ArrayPattern />`);
            break;
        }
      } else {
        yield eat(m`<Identifier />`);
      }

      return r(shiftMatch(m`<AssignmentPattern '=' />`));
    }

    *ObjectPattern() {
      yield eat(m`openToken*: <* '{' />`);
      yield* List({
        element: m`params[]+$: <PropertyPattern />`,
        allowTrailingSeparator: true,
        separator: m`#separatorTokens: <* ',' />`,
      });
      yield eat(m`closeToken*: <* '}' />`);
    }

    *PropertyPattern({ s, ctx }) {
      let { getGapNode } = ctx;
      let index, key;
      let { held } = s();
      yield startSubspan(null, ',');
      if ((index = yield eatMatch(m`key+$: <*UnsignedInteger />`))) {
      } else {
        key = yield eat(m`key+$: <Identifier />`, o({ scoped: false, held: 'eat' }));
      }

      if (index || !(yield shiftMatch(m`<AssignmentPattern '=' />`))) {
        let cn =
          index || (key && reservedWords_.has(printSource(held, { getGapNode }).trim()))
            ? yield eat(m`mapOperator*: <* ':' />`)
            : yield eatMatch(m`mapOperator*: <* ':' />`);
        if (cn) {
          yield eatMatch(m`value+$: <_CapturePattern />`);
          yield shiftMatch(m`<AssignmentPattern '=' />`);
        }
      }
      yield endSpan();
    }

    *AssignmentPattern() {
      yield eat(m`source+$: <Identifier />`, o({}), o({ held: 'eat' }));
      yield eat(m`assignmentOperator*: <* '=' />`);
      yield startSubspan(null, ',');
      yield eat(m`defaultValue+$: <_Expression />`);
      yield endSpan();
    }

    *ArrayPattern() {
      yield eat(m`openToken*: <* '[' />`);
      yield* List({
        element: m`params[]+$: <_CapturePattern />`,
        allowTrailingSeparator: true,
        separator: m`#separatorTokens: <* ',' />`,
      });
      yield eat(m`closeToken*: <* ']' />`);
    }

    *ArrowFunctionExpression() {
      if (yield match(m`'('`)) {
        yield eat(m`openParamsToken*: <* '(' />`);
        yield startSpan('Bare', ')');

        let sep, it;
        for (;;) {
          if ((it = yield eatMatch(m`params[]+$: <_CapturePattern />`))) {
          } else {
            it = yield eatMatch(m`params[]+$: <SpreadPattern '...' />`);
          }
          if (it) {
            sep = yield eatMatch(m`#separatorTokens: <* ',' />`);
          } else {
            sep = null;
          }
          if (!sep) break;
        }

        yield endSpan();
        yield eat(m`closeParamsToken*: <* ')' />`);
      } else {
        yield eat(m`params[]+$: <Identifier />`);
        yield eat(m`openParamsToken*: null`);
        yield eat(m`closeParamsToken*: null`);
      }

      // TODO no newline allowed here. How?

      yield eat(m`sigilToken*: <*Keyword '=>' />`);

      if (yield match(m`'{'`)) {
        yield eat(m`body+$: <Block />`);
      } else {
        yield startSubspan(null, ',');
        yield eat(m`body+$: <_Expression />`);
        yield endSpan();
      }
    }

    *SpreadPattern() {
      yield eat(m`sigilToken*: <* '...' />`);
      yield eat(m`value$: <Identifier />`);
    }

    *CallExpression() {
      yield eat(m`callee+$: <_Expression />`, o({}), o({ held: 'eat' }));
      yield eat(m`openArgumentsToken*: <* '(' />`);
      yield startSpan('Bare', ')');
      let sep = true;
      while (sep && !(yield match(m`/$/`))) {
        yield startSubspan(null, ',');
        yield eat(m`arguments[]+$: <_Expression />`);
        yield endSpan();
        sep = yield eatMatch(m`#separatorTokens: <* ',' />`);
      }
      if (sep && sep !== true) yield fail();
      yield endSpan();
      yield eat(m`closeArgumentsToken*: <* ')' />`);
    }
  }

  freeze(ES6FunctionGrammar);
  freeze(ES6FunctionGrammar.prototype);

  return ES6FunctionGrammar;
};

export default mixin;
