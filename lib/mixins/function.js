import { spam as m, re } from '@bablr/boot';
import {
  o,
  r,
  eat,
  eatMatch,
  fail,
  match,
  shiftMatch,
  defineAttribute,
} from '@bablr/helpers/grammar';

export const mixin = (Base) =>
  class es6FunctionGrammar extends Base {
    *FunctionExpression({ props: { shorthand } }) {
      if (!shorthand) {
        yield eat(m`sigilToken*: <*Keyword 'function' />`);
      } else {
        yield eat(m`sigilToken*: null`);
      }

      let a = yield eatMatch(m`asyncToken*: <*Keyword 'async' />`);
      let gen = yield eatMatch(m`starToken*: <*Punctuator '*' />`);

      if (a && gen) yield fail();

      if (!shorthand) {
        yield eatMatch(m`id*: <Identifier />`, o({}), o({ bind: true }));
      } else {
        yield eat(m`id*: null`);
      }

      yield eat(m`openParamsToken*: <*Punctuator '(' { balanced: ')' } />`);
      let sep, it;
      for (;;) {
        if ((it = yield eatMatch(m`params[]+$: <_CapturePattern />`))) {
        } else {
          it = yield eatMatch(m`params[]+$: <SpreadPattern '...' />`);
        }
        if (it) {
          sep = yield eatMatch(m`#separatorTokens[]: <*Punctuator ',' />`);
        } else {
          sep = null;
        }
        if (!sep) break;
      }
      yield eat(m`closeParamsToken*: <*Punctuator ')' { balancer: true } />`);
      yield eat(m`body$: <BlockStatement />`);
    }

    *FunctionStatement() {
      yield eat(m`sigilToken*: <*Keyword 'function' />`);

      let a = yield eatMatch(m`asyncToken*: <*Keyword 'async' />`);
      let gen = yield eatMatch(m`starToken*: <*Punctuator '*' />`);

      if (a && gen) yield fail();

      yield eat(m`id$: <Identifier />`, o({}), o({ bind: true }));

      yield eat(m`openParamsToken*: <*Punctuator '(' { balanced: ')' } />`);
      let sep, it;
      for (;;) {
        if ((it = yield eatMatch(m`params[]+$: <_CapturePattern />`))) {
        } else {
          it = yield eatMatch(m`params[]+$: <SpreadPattern '...' />`);
        }
        if (it) {
          sep = yield eatMatch(m`#separatorTokens[]: <*Punctuator ',' />`);
        } else {
          sep = null;
        }
        if (!sep) break;
      }
      yield eat(m`closeParamsToken*: <*Punctuator ')' { balancer: true } />`);
      yield eat(m`body$: <BlockStatement />`);
    }

    *YieldExpression() {
      yield eat(m`sigilToken*: <*Keyword 'yield' />`);
      yield eatMatch(m`starToken*: <*Punctuator '*' />`, null, o({ bind: true }));
      yield eat(m`expression+$: <_Expression />`);
    }

    *CapturePattern({ ctx }) {
      let pn;

      if ((pn = yield match(re`/[[{]/`))) {
        switch (ctx.sourceTextFor(pn).trim()) {
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
      yield eat(m`openToken*: <*Punctuator '{' { balanced: '}' } />`);
      yield eat(
        m`params[]+$: <__List />`,
        o({
          element: m`<PropertyPattern />`,
          allowTrailingSeparator: true,
          separator: m`#separatorTokens[]: <*Punctuator ',' />`,
        }),
      );
      yield eat(m`closeToken*: <*Punctuator '}' { balancer: true } />`);
    }

    *PropertyPattern() {
      let index;
      if ((index = yield eatMatch(m`key+$: <UnsignedInteger />`))) {
      } else {
        yield eat(m`key+$: <Identifier />`);
      }

      if (index || !(yield shiftMatch(m`<AssignmentPattern /=/ />`))) {
        let cn = index
          ? yield eat(m`mapOperator*: <*Punctuator ':' />`, null, o({ bind: true }))
          : yield eatMatch(m`mapOperator*: <*Punctuator ':' />`, null, o({ bind: true }));
        if (cn) {
          yield eatMatch(m`value+$: <_CapturePattern />`);
          yield shiftMatch(m`<AssignmentPattern /=/ />`);
        }
      }
    }

    *AssignmentPattern() {
      yield eat(m`source+$: <Identifier />`);
      yield eat(m`assignmentOperator*: <*Punctuator '=' />`);
      yield eat(m`defaultValue+$: <_Expression />`, o({ power: 32 }));
    }

    *ArrayPattern() {
      yield eat(m`openToken*: <*Punctuator '[' { balanced: ']' } />`);
      yield eat(
        m`params[]+$: <__List />`,
        o({
          element: m`<_CapturePattern />`,
          allowTrailingSeparator: true,
          separator: m`#separatorTokens[]: <*Punctuator ',' />`,
        }),
      );
      yield eat(m`closeToken*: <*Punctuator ']' { balancer: true } />`);
    }

    *ArrowFunctionExpression() {
      if (yield match('(')) {
        yield eat(m`openParamsToken*: <*Punctuator '(' { balanced: ')' } />`);

        let sep, it;
        for (;;) {
          if ((it = yield eatMatch(m`params[]+$: <_CapturePattern />`))) {
          } else {
            it = yield eatMatch(m`params[]+$: <SpreadPattern '...' />`);
          }
          if (it) {
            sep = yield eatMatch(m`#separatorTokens[]: <*Punctuator ',' />`);
          } else {
            sep = null;
          }
          if (!sep) break;
        }

        yield eat(m`closeParamsToken*: <*Punctuator ')' { balancer: true } />`);
      } else {
        yield eat(m`params[]+$: <Identifier />`);
        yield eat(m`openParamsToken*:null`);
        yield eat(m`closeParamsToken*:null`);
      }

      // TODO no newline allowed here. How?

      yield eat(m`sigilToken*: <*Keyword '=>' />`);

      if (yield match('{')) {
        yield eat(m`body+$: <BlockStatement />`);
      } else {
        yield eat(m`body+$: <_Expression />`, o({ power: 32 }));
      }
    }

    *SpreadPattern() {
      yield eat(m`sigilToken*: <*Punctuator '...' />`);
      yield eat(m`value$: <Identifier />`);
    }

    *CallExpression() {
      yield eat(m`callee+$: <_Expression />`, o({ power: 4 }));
      yield defineAttribute('power', 6);
      yield eat(m`openArgumentsToken*: <*Punctuator '(' { balanced: ')' } />`);
      yield eat(
        m`arguments[]+$: <__List />`,
        o({
          element: m`<_Element />`,
          allowTrailingSeparator: false,
          separator: m`#separatorTokens[]: <*Punctuator ',' />`,
        }),
      );
      yield eat(m`closeArgumentsToken*: <*Punctuator ')' { balancer: true } />`);
    }
  };
