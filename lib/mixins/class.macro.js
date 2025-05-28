import { spam as m } from '@bablr/boot';
import { CoveredBy, Node } from '@bablr/helpers/decorators';
import { o, eat, eatMatch } from '@bablr/helpers/grammar';

export const mixin = (Base) =>
  class ES6ClassGrammar extends Base {
    @Node
    *ClassDeclaration() {
      yield eat(m`sigilToken: <*Keyword 'class' />`);

      yield eat(m`name$: <Identifier />`);

      if (yield eatMatch(m`extendsToken: <*Keyword 'extends' />`, o({}), o({ bind: true }))) {
        yield eat(m`superClass$: <__Expression>`);
      } else {
        yield eat(m`superClass$: null`);
      }

      yield eat(m`body: <ClassBody />`);
    }

    @CoveredBy('Expression')
    @Node
    *ClassExpression() {
      yield eat(m`sigilToken: <*Keyword 'class' />`);

      yield eatMatch(m`name$: <Identifier />`);

      if (yield eatMatch(m`extendsToken: <*Keyword 'extends' />`)) {
        yield eat(m`superClass$: <__Expression>`);
      } else {
        yield eat(m`superClass$: null`);
      }

      yield eat(m`body: <ClassBody />`);
    }

    @Node
    *ClassBody() {
      yield eat(m`openToken: <*Punctuator '{' { balanced: '}' } />`);
      while (yield eatMatch(m`members[]: <__ClassMember />`)) {}
      yield eat(m`closeToken: <*Punctuator '}' { balancer: true } />`);
    }

    *ClassMember() {
      yield eat(m`<ClassMethod />`);
    }

    @CoveredBy('ClassMember')
    @Node
    *ClassMethod() {
      yield eatMatch(m`staticToken: <*Keyword 'static' />`);
      yield eatMatch(m`kindToken: <*Keyword /get|set/ />`);
      yield eat(m`id: <Identifier />`);
      yield eat(m`value$: <FunctionExpression />`, o({ shorthand: true }));
    }

    @CoveredBy('Expression')
    @Node
    *SuperExpression() {
      yield eat(m`sigilToken: <*Keyword 'super' />`);
    }

    @CoveredBy('Expression')
    @Node
    *ThisExpression() {
      yield eat(m`sigilToken: <*Keyword 'this' />`);
    }
  };
