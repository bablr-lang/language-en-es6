import { spam as m } from '@bablr/boot';
import { o, eat, eatMatch, match, fail } from '@bablr/helpers/grammar';

const mixin = (Base) =>
  class ES6ImportGrammar extends Base {
    *ImportDeclaration() {
      yield eat(m`sigilToken*: <*Keyword 'import' />`);

      if (yield eatMatch(m`specifiers[]$: <ImportNamespaceSpecifier '*' />`)) {
        yield eat(m`fromToken*: <*Keyword 'from' />`);
      } else {
        let spec = yield eatMatch(m`specifiers[]$: <ImportDefaultSpecifier />`);
        let sep = spec ? null : yield eatMatch(m`separators[]*: <* ',' />`);

        let open = yield eatMatch(
          m`openSpecifiersToken*: <* '{' { balanced: '}' } />`,
          o({}),
          o({ bind: true }),
        );

        if (open) {
          let first = true;
          while (first || sep) {
            spec = yield eatMatch(m`specifiers[]$: <ImportSpecifier />`);
            sep = yield eatMatch(m`separators[]*: <* ',' />`);
            first = false;
          }

          yield eat(m`closeSpecifiersToken*: <* '}' { balancer: true } />`);
        } else {
          yield eat(m`closeSpecifiersToken*: null`);
        }

        yield eat(m`fromToken*: <*Keyword 'from' />`);
      }
      yield eat(m`source$: <String />`);
      yield eatMatch(m`endToken*: <* ';' />`, o({}), o({ bind: true }));
    }

    *ImportSpecifier() {
      let str;

      if ((str = yield eatMatch(m`imported$: <String /['"]/ />`))) {
      } else {
        yield eat(m`imported$: <Identifier />`);
      }

      if (str || (yield match('as'))) {
        yield eat(m`mapOperator*: <*Keyword 'as' />`);
        yield eat(m`local$: <Identifier />`);
      } else {
        yield eat(m`mapOperator*: null`);
        yield eat(m`local$: null`);
      }
    }

    *ImportDefaultSpecifier() {
      yield eat(m`local*: <Identifier />`);
    }

    *ImportNamespaceSpecifier() {
      yield eat(m`sigilToken*: <* '*' />`);
      yield eat(m`mapOperator*: <*Keyword 'as' />`);
      yield eat(m`local$: <Identifier />`);
    }

    *ExportDeclaration() {
      yield eat(m`sigilToken*: <*Keyword 'export' />`);

      let curly, defSpec, spec, def, from, sep;

      yield eatMatch(m`declaration+$: null`);

      if ((def = yield match('default'))) {
        yield eatMatch(m`defaultToken*: <*Keyword 'default' />`);

        if (yield eatMatch(m`declaration+$: <ClassDeclaration 'class' />`)) {
        } else if (yield eatMatch(m`declaration+$: <FunctionDeclaration /function|async/ />`)) {
        } else {
          yield eat(m`declaration+$: <_Expression />`);
        }
      } else {
        yield eat(m`defaultToken*: null`);
      }

      defSpec = spec = yield eatMatch(m`specifiers[]$: <ExportDefaultSpecifier />`);
      defSpec = defSpec || (yield eatMatch(m`specifiers[]$: <ExportAllSpecifier '*' />`));

      if (spec) {
        sep = yield eatMatch(m`#separatorTokens[]: <* ',' />`);
      }

      if ((!defSpec || sep) && (curly = yield match('{'))) {
        yield eat(m`openSpecifiersToken*: <* '{' { balanced: '}' } />`);

        let first = true;
        while (first || (spec && sep)) {
          spec = yield eat(m`specifiers[]$: <ExportSpecifier />`);
          sep = yield eatMatch(m`#separatorTokens[]: <* ',' />`);
          first = false;
        }
        yield eat(m`closeSpecifiersToken*: <* '}' { balancer: true } />`);
      } else {
        yield eat(m`openSpecifiersToken*: null />`);
        yield eat(m`closeSpecifiersToken*: null />`);
      }

      if ((defSpec || curly) && (from = yield match('from'))) {
        yield eatMatch(m`fromToken*: <*Keyword 'from' />`);
        yield eat(m`source$: <String />`);
      } else {
        yield eatMatch(m`fromToken*: null`);
        yield eat(m`source$: null`);
      }

      if (!def && !defSpec && !curly && !from) {
        if (yield eatMatch(m`declaration+$: <VariableDeclaration /var|const|let/ />`)) {
        } else if (yield eatMatch(m`declaration+$: <ClassDeclaration 'class' />`)) {
        } else if (yield eatMatch(m`declaration+$: <FunctionDeclaration />`)) {
        } else {
          yield fail();
        }
      }
      yield eatMatch(m`endToken*: <* ';' />`, o({}), o({ bind: true }));
    }

    *ExportDefaultSpecifier() {
      yield eat(m`local$: <Identifier />`);
    }

    *ExportAllSpecifier() {
      yield eat(m`sigilToken*: <*Keyword '*' />`);
    }

    *ExportSpecifier() {
      yield eat(m`local$: <Identifier />`);

      let as_ = yield eatMatch(m`mapOperator*: <*Keyword 'as' />`, o({}), o({ bind: true }));

      if (as_) {
        if (yield eatMatch(m`imported$: <String /['"]/ />`)) {
        } else {
          yield eat(m`imported$: <Identifier />`);
        }
      } else {
        yield eat(m`imported$: null`);
      }
    }
  };

export default mixin;
