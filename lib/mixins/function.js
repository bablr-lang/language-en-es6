import { spam as m, re } from '@bablr/boot';
import { o, r, eat, eatMatch, fail, match, shiftMatch } from '@bablr/helpers/grammar';

export const mixin = (Base) =>
  class es6FunctionGrammar extends Base {
    *FunctionExpression({ props: { shorthand } }) {
      if (!shorthand) {
        yield eat(m`sigilToken: <*Keyword 'function' />`);
      } else {
        yield eat(m`sigilToken: null`);
      }

      let a = yield eatMatch(m`asyncToken: <*Keyword 'async' />`);
      let gen = yield eatMatch(m`starToken: <*Punctuator '*' />`);

      if (a && gen) yield fail();

      if (!shorthand) {
        yield eatMatch(m`id: <Identifier />`, o({}), o({ bind: true }));
      } else {
        yield eat(m`id: null`);
      }

      yield eat(m`openParamsToken: <*Punctuator '(' { balanced: ')' } />`);
      yield eat(
        m`params[]+: <__List />`,
        o({
          element: m`<_CapturePattern />`,
          allowTrailingSeparator: false,
          separator: m`separatorTokens[]: <*Punctuator ',' />`,
        }),
      );
      yield eat(m`closeParamsToken: <*Punctuator ')' { balancer: true } />`);
      yield eat(m`body: <BlockStatement />`);
    }

    *FunctionStatement() {
      yield eat(m`sigilToken: <*Keyword 'function' />`);

      let a = yield eatMatch(m`asyncToken: <*Keyword 'async' />`);
      let gen = yield eatMatch(m`starToken: <*Punctuator '*' />`);

      if (a && gen) yield fail();

      yield eat(m`id: <Identifier />`, o({}), o({ bind: true }));

      yield eat(m`openParamsToken: <*Punctuator '(' { balanced: ')' } />`);
      yield eat(
        m`params[]+: <__List />`,
        o({
          element: m`<_CapturePattern />`,
          allowTrailingSeparator: false,
          separator: m`separatorTokens[]: <*Punctuator ',' />`,
        }),
      );
      yield eat(m`closeParamsToken: <*Punctuator ')' { balancer: true } />`);
      yield eat(m`body: <BlockStatement />`);
    }

    *YieldExpression() {
      yield eat(m`sigilToken: <*Keyword 'yield' />`);
      yield eatMatch(m`starToken: <*Punctuator '*' />`, null, o({ bind: true }));
      yield eat(m`expression+$: <_Expression />`);
    }

    // (type = null, { prop, value: name = {} }) => {};

    *CapturePattern({ ctx, s }) {
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
      yield eat(m`openToken: <*Punctuator '{' { balanced: '}' } />`);
      yield eat(
        m`params[]+$: <__List />`,
        o({
          element: m`<PropertyPattern />`,
          allowTrailingSeparator: true,
          separator: m`separatorTokens[]: <*Punctuator ',' />`,
        }),
      );
      yield eat(m`closeToken: <*Punctuator '}' { balancer: true } />`);
    }

    *PropertyPattern() {
      yield eatMatch(m`key+$: <Identifier />`);
      let val;
      if (!(val = yield shiftMatch(m`<AssignmentPattern /=/ />`))) {
        let cn = yield eatMatch(m`mapOperator: <*Punctuator ':' />`, null, o({ bind: true }));
        if (cn) {
          yield eatMatch(m`value+$: <Identifier />`);
          yield shiftMatch(m`<AssignmentPattern /=/ />`);
        }
      }
    }

    *AssignmentPattern() {
      yield eat(m`source+$: <Identifier />`);
      yield eat(m`assignmentOperator: <*Punctuator '=' />`);
      yield eat(m`defaultValue+$: <_Expression />`, o({ power: 32 }));
    }

    *ArrayPattern() {
      yield eat(m`openToken: <*Punctuator '[' { balanced: ']' } />`);
      yield eat(
        m`params[]+$: <__List />`,
        o({
          element: m`<_CapturePattern />`,
          allowTrailingSeparator: true,
          separator: m`separatorTokens[]: <*Punctuator ',' />`,
        }),
      );
      yield eat(m`closeToken: <*Punctuator ']' { balancer: true } />`);
    }

    *ArrowFunctionExpression() {
      // yield eat(m`params[]+: []`);
      if (yield match('(')) {
        yield eat(m`openParamsToken: <*Punctuator '(' { balanced: ')' } />`);
        yield eat(
          m`params[]+$: <__List />`,
          o({
            element: m`<_CapturePattern />`,
            allowTrailingSeparator: false,
            separator: m`separatorTokens[]: <*Punctuator ',' />`,
          }),
        );
        yield eat(m`closeParamsToken: <*Punctuator ')' { balancer: true } />`);
      } else {
        yield eat(m`params[]+$: <Identifier />`);
        yield eat(m`openParamsToken: null`);
        yield eat(m`closeParamsToken: null`);
      }

      yield eat(m`sigilToken: <*Keyword '=>' />`);

      if (yield match('{')) {
        yield eat(m`body+$: <BlockStatement />`);
      } else {
        yield eat(m`body+$: <_Expression />`);
      }
    }
  };
