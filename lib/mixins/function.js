import { spam as m, re } from '@bablr/boot';
import { o, r, eat, eatMatch, fail, match, shiftMatch, eatHeld } from '@bablr/helpers/grammar';
import { reservedWords } from '@bablr/language-en-es5';
import { List } from '@bablr/helpers/productions';
import { printSource } from '@bablr/agast-helpers/tree';

let reservedWords_ = new Set(reservedWords);

const mixin = (Base) =>
  class es6FunctionGrammar extends Base {
    *FunctionExpression({ props: { shorthand } }) {
      if (!shorthand) {
        yield eat(m`sigilToken*: <*Keyword 'function' />`);
      }

      let a = yield eatMatch(m`asyncToken*: <*Keyword 'async' />`);
      let gen = yield eatMatch(m`starToken*: <* '*' />`);

      if (a && gen) yield fail();

      if (!shorthand) {
        yield eatMatch(m`name$: <Identifier />`, o({}), o({ bind: true }));
      } else {
        yield eat(m`name$: null`);
      }

      yield eat(m`openParamsToken*: <* '(' />`);
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
      yield eat(m`closeParamsToken*: <* ')' />`);
      yield eat(m`body$: <Block />`);
    }

    *FunctionDeclaration() {
      yield eat(m`sigilToken*: <*Keyword 'function' />`);

      let a = yield eatMatch(m`asyncToken*: <*Keyword 'async' />`);
      let gen = yield eatMatch(m`starToken*: <* '*' />`);

      if (a && gen) yield fail();

      yield eat(m`name$: <Identifier />`, o({}), o({ bind: true }));

      yield eat(m`openParamsToken*: <* '(' />`);
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
      yield eat(m`closeParamsToken*: <* ')' />`);
      yield eat(m`body$: <Block />`);
    }

    *YieldExpression() {
      yield eat(m`sigilToken*: <*Keyword 'yield' />`);
      yield eatMatch(m`starToken*: <* '*' />`);
      yield eat(m`expression+$: <_Expression />`);
    }

    *CapturePattern(printSource) {
      let pn;

      if ((pn = yield match(re`/[[{]/`))) {
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

        return r(shiftMatch(m`<AssignmentPattern '=' />`));
      }
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

    *PropertyPattern() {
      let index, key;
      if ((index = yield eatMatch(m`key+$: <UnsignedInteger />`))) {
      } else {
        key = yield eat(m`key+$: <Identifier />`, o({ scoped: false }));
      }

      if (index || !(yield shiftMatch(m`<AssignmentPattern /=/ />`))) {
        let cn =
          index || (key && reservedWords_.has(printSource(key.node)))
            ? yield eat(m`mapOperator*: <* ':' />`)
            : yield eatMatch(m`mapOperator*: <* ':' />`);
        if (cn) {
          yield eatMatch(m`value+$: <_CapturePattern />`);
          yield shiftMatch(m`<AssignmentPattern /=/ />`);
        }
      }
    }

    *AssignmentPattern() {
      yield eatHeld(m`source+$: <Identifier />`);
      yield eat(m`assignmentOperator*: <* '=' />`);
      yield eat(m`defaultValue+$: <_Expression />`, o({ power: 32 }));
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
      if (yield match('(')) {
        yield eat(m`openParamsToken*: <* '(' />`);

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

        yield eat(m`closeParamsToken*: <* ')' />`);
      } else {
        yield eat(m`params[]+$: <Identifier />`);
        yield eat(m`openParamsToken*:null`);
        yield eat(m`closeParamsToken*:null`);
      }

      // TODO no newline allowed here. How?

      yield eat(m`sigilToken*: <*Keyword '=>' />`);

      if (yield match('{')) {
        yield eat(m`body+$: <Block />`);
      } else {
        yield eat(m`body+$: <_Expression />`, o({ power: 32 }));
      }
    }

    *SpreadPattern() {
      yield eat(m`sigilToken*: <* '...' />`);
      yield eat(m`value$: <Identifier />`);
    }

    *CallExpression() {
      yield eatHeld(m`callee+$: <_Expression />`);
      yield eat(m`openArgumentsToken*: <* '(' />`);
      yield* List({
        element: m`arguments[]+$: <_Element />`,
        allowTrailingSeparator: false,
        separator: m`#separatorTokens: <* ',' />`,
      });
      yield eat(m`closeArgumentsToken*: <* ')' />`);
    }
  };

export default mixin;
