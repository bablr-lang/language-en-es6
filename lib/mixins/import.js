import { freezeClass } from '@bablr/agast-helpers/object';
import {
  m,
  eat,
  eatMatch,
  match,
  fail,
  startSpan,
  endSpan,
  startSubspan,
} from '@bablr/helpers/grammar';

const mixin = (Base) => {
  class ES6ImportGrammar extends Base {
    *ImportDeclaration() {
      yield eat(m`sigilToken*: <*Keyword 'import' />`);

      if (yield eatMatch(m`specifiers[]$: <ImportNamespaceSpecifier '*' />`)) {
        yield eat(m`fromToken*: <*Keyword 'from' />`);
      } else {
        let spec = yield eatMatch(m`specifiers[]$: <ImportDefaultSpecifier />`);
        let sep = spec ? null : yield eatMatch(m`separators[]*: <* ',' />`);

        let open = yield eatMatch(m`openSpecifiersToken*: <* '{' />`);

        if (open) {
          yield startSubspan(null, '}');
          let first = true;
          while ((first || sep) && (yield match(m`/./`))) {
            spec = yield eatMatch(m`specifiers[]$: <ImportSpecifier />`);
            sep = yield eatMatch(m`separators[]*: <* ',' />`);
            first = false;
          }

          yield endSpan();
          yield eat(m`closeSpecifiersToken*: <* '}' />`);
        }

        if (spec !== null) {
          yield eat(m`fromToken*: <*Keyword 'from' />`);
        }
      }
      yield eat(m`source$: <String />`);
    }

    *ImportSpecifier() {
      let str;

      if ((str = yield eatMatch(m`imported$: <String /['"]/ />`))) {
      } else {
        yield eat(m`imported$: <*Identifier />`);
      }

      if (str || (yield match(m`'as'`))) {
        yield eat(m`mapOperator*: <*Keyword 'as' />`);
        yield eat(m`local$: <*Identifier />`);
      } else {
        yield eat(m`local$: null`);
      }
    }

    *ImportDefaultSpecifier() {
      yield eat(m`local*: <*Identifier />`);
    }

    *ImportNamespaceSpecifier() {
      yield eat(m`sigilToken*: <* '*' />`);
      yield eat(m`mapOperator*: <*Keyword 'as' />`);
      yield eat(m`local$: <*Identifier />`);
    }

    *ExportDeclaration() {
      yield eat(m`sigilToken*: <*Keyword 'export' />`);

      let curly, defSpec, spec, def, from, sep;

      yield eatMatch(m`declaration$: null`);

      if ((def = yield match(m`'default'`))) {
        yield eatMatch(m`defaultToken*: <*Keyword 'default' />`);

        if (yield eatMatch(m`declaration$: <ClassDeclaration 'class' />`)) {
        } else if (yield eatMatch(m`declaration$: <FunctionDeclaration /function|async/ />`)) {
        } else {
          yield eat(m`declaration+$: <_Expression />`);
        }
      }

      defSpec = yield eatMatch(m`specifiers[]$: <ExportAllSpecifier '*' />`);

      if (spec) {
        sep = yield eatMatch(m`#separatorTokens: <* ',' />`);
      }

      if ((!defSpec || sep) && (curly = yield match(m`'{'`))) {
        yield eat(m`openSpecifiersToken*: <* '{' />`);
        yield startSubspan(null, '}');

        let first = true;
        while ((first || sep) && (yield match(m`/./`))) {
          spec = yield eat(m`specifiers[]$: <ExportSpecifier />`);
          sep = yield eatMatch(m`#separatorTokens: <* ',' />`);
          first = false;
        }
        yield endSpan();
        yield eat(m`closeSpecifiersToken*: <* '}' />`);
      }

      if ((defSpec || curly) && (from = yield match(m`'from'`))) {
        yield eatMatch(m`fromToken*: <*Keyword 'from' />`);
        yield eat(m`source$: <String />`);
      }

      if (!def && !defSpec && !curly && !from) {
        if (yield eatMatch(m`declaration$: <VariableDeclaration /var|const|let/ />`)) {
        } else if (yield eatMatch(m`declaration$: <ClassDeclaration 'class' />`)) {
        } else if (yield eatMatch(m`declaration$: <FunctionDeclaration />`)) {
        } else {
          yield fail();
        }
      }
    }

    *ExportDefaultSpecifier() {
      yield eat(m`local$: <*Identifier />`);
    }

    *ExportAllSpecifier() {
      yield eat(m`sigilToken*: <*Keyword '*' />`);
    }

    *ExportSpecifier() {
      yield eat(m`local$: <*Identifier />`);

      let as_ = yield eatMatch(m`mapOperator*: <*Keyword 'as' />`);

      if (as_) {
        if (yield eatMatch(m`imported$: <String /['"]/ />`)) {
        } else {
          yield eat(m`imported$: <*Identifier />`);
        }
      } else {
        yield eat(m`imported$: null`);
      }
    }
  }

  freezeClass(ES6ImportGrammar);

  return ES6ImportGrammar;
};

export default mixin;
