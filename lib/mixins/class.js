import { spam as m } from '@bablr/boot';
import { o, eat, eatMatch, fail } from '@bablr/helpers/grammar';
import { List } from '@bablr/helpers/productions';

const mixin = (Base) =>
  class ES6ClassGrammar extends Base {
    *ClassDeclaration() {
      yield eat(m`sigilToken*: <*Keyword 'class' />`);

      yield eat(m`name$: <Identifier />`);

      if (yield eatMatch(m`extendsToken*: <*Keyword 'extends' />`, o({}), o({ bind: true }))) {
        yield eat(m`superClass+$: <_Expression />`);
      } else {
        yield eat(m`superClass+$: null`);
      }

      yield eat(m`body$: <ClassBody />`);
    }

    *ClassExpression() {
      yield eat(m`sigilToken*: <*Keyword 'class' />`);

      yield eatMatch(m`name$: <Identifier />`);

      if (yield eatMatch(m`extendsToken*: <*Keyword 'extends' />`)) {
        yield eat(m`superClass+$: <_Expression />`);
      } else {
        yield eat(m`superClass+$: null`);
      }

      yield eat(m`body$: <ClassBody />`);
    }

    *ClassBody() {
      yield eat(m`openToken*: <* '{' />`);
      while (yield eatMatch(m`members[]$: <_ClassMember />`)) {}
      yield eat(m`closeToken*: <* '}' />`);
    }

    *ClassMember() {
      yield eat(m`<ClassMethod />`);
    }

    *ClassMethod() {
      yield eatMatch(m`staticToken*: <*Keyword 'static' />`);
      let acc, a, gen;
      acc = yield eatMatch(m`kindToken*: <*Keyword /get|set/ />`);

      if (!acc) {
        a = yield eatMatch(m`asyncToken*: <*Keyword 'async' />`);
        gen = yield eatMatch(m`starToken*: <* '*' />`);
      } else {
        yield eatMatch(m`asyncToken*: null`);
        yield eatMatch(m`starToken*: null`);
      }

      if (a && gen) yield fail();

      if (yield eatMatch(m`openIdToken*: <* '[' />`, o({}), o({ bind: true }))) {
        yield eat(m`id+$: <_Expression />`);
        yield eat(m`closeIdToken*: <* ']' />`);
      } else {
        yield eatMatch(m`id+$: <Identifier />`, o({}), o({ bind: true }));
        yield eatMatch(m`closeIdToken*: null`);
      }

      yield eat(m`openParamsToken*: <* '(' />`);
      yield* List({
        element: m`params[]+$: <_CapturePattern />`,
        allowTrailingSeparator: false,
        separator: m`#separatorTokens: <* ',' />`,
      });
      yield eat(m`closeParamsToken*: <* ')' />`);
      yield eat(m`body$: <Block />`);
    }

    *SuperExpression() {
      yield eat(m`sigilToken*: <*Keyword 'super' />`);
    }
  };

export default mixin;
