import { spam as m, re } from '@bablr/boot';
import {
  o,
  eat,
  eatMatch,
  fail,
  endSpan,
  startSpan,
  match,
  startSubspan,
} from '@bablr/helpers/grammar';

const mixin = (Base) =>
  class ES6ClassGrammar extends Base {
    *ClassDeclaration() {
      yield eat(m`sigilToken*: <*Keyword 'class' />`);

      yield eat(m`name$: <Identifier />`);

      if (yield eatMatch(m`extendsToken*: <*Keyword 'extends' />`)) {
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
      }

      if (a && gen) yield fail();

      if (yield eatMatch(m`openNameToken*: <* '[' />`)) {
        yield eat(m`name+$: <_Expression />`);
        yield eat(m`closeNameToken*: <* ']' />`);
      } else {
        yield eatMatch(m`name+$: <Identifier />`, o({}), o({ bind: true }));
      }

      yield eat(m`openParamsToken*: <* '(' />`);

      yield startSpan('Bare', ')');
      let sep = true;
      while (sep && !(yield match(re`/$/`))) {
        yield startSubspan(null, ',');
        yield eat(m`params[]+$: <_CapturePattern />`);
        yield endSpan();
        sep = yield eatMatch(m`#separatorTokens: <* ',' />`);
      }
      if (sep && sep !== true) yield fail();

      yield endSpan();
      yield eat(m`closeParamsToken*: <* ')' />`);
      yield eat(m`body$: <Block />`);
    }

    *SuperExpression() {
      yield eat(m`sigilToken*: <*Keyword 'super' />`);
    }
  };

export default mixin;
