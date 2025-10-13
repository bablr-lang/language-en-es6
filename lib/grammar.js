import { re, spam as m } from '@bablr/boot';
import { eat, eatMatch, shiftMatch, match, o, r } from '@bablr/helpers/grammar';
import { triviaEnhancer } from '@bablr/helpers/trivia';
import * as Space from '@bablr/language-en-blank-space';
import * as Comment from '@bablr/language-en-c-comments';
import * as es5 from '@bablr/language-en-es5';
import { mixin as classMixin } from './mixins/class.js';
import { mixin as importMixin } from './mixins/import.js';
import { mixin as functionMixin } from './mixins/function.js';
import { mixin as stringMixin } from './mixins/string.js';
import { buildPattern, buildString } from '@bablr/helpers/builders';
import { unaryPrefixOperatorAlternatives } from '@bablr/language-en-es5';

export const dependencies = { Comment, Space };

export {
  powerLevels,
  reservedWords,
  assignmentOperators,
  assignmentOperatorAlternatives,
  unaryPrefixOperators,
  unaryPrefixOperatorAlternatives,
  unaryPostfixOperators,
  unaryPostfixOperatorAlternatives,
  getBinaryOperatorAlternatives,
} from '@bablr/language-en-es5';

export const canonicalURL = 'https://bablr.org/languages/universe/es6';

export const defaultMatcher = m`.+: <_Expression />`;

export const atrivialGrammar = class ES6Grammar extends importMixin(
  classMixin(functionMixin(stringMixin(es5.atrivialGrammar))),
) {
  constructor() {
    super();
    this.emptyables = new Set([...(this.emptyables || []), 'Statement']);
  }

  *Expression(args) {
    let {
      props: { power = 34, noIn = false },
      s,
    } = args;
    let yieldPower = 0; // TODO fixme

    let res;
    if (!s.holding) {
      if ((res = yield eatMatch(m`<TemplateString ${buildString('`')} />`))) {
      } else if ((res = yield eatMatch(m`<ArrowFunctionExpression '(' />`))) {
      } else if ((res = yield eatMatch(m`<ParenthesisExpression '(' />`))) {
      } else if (power > yieldPower && (res = yield eatMatch(m`<YieldExpression 'yield' />`))) {
      } else if ((res = yield eatMatch(m`<_JSONExpression />`))) {
      } else if ((res = yield eatMatch(m`<FunctionExpression 'function' />`))) {
      } else if (
        power >= 4 &&
        (res = yield eatMatch(
          m`<UnaryExpression ${buildPattern(unaryPrefixOperatorAlternatives)} />`,
        ))
      ) {
      } else if (power >= 4 && (res = yield eatMatch(m`<NewExpression 'new' />`, o({ power })))) {
      } else {
        res = yield eat(m`<Identifier />`);
      }
    } else {
      res = yield eat(m`<_LogicExpression />`, o({ power, noIn }));
    }
    if (res) {
      return r(shiftMatch(m`<_Expression />`, o({ power })));
    }
  }

  *Statement(args) {
    if (yield eatMatch(m`<ImportDeclaration 'import' />`)) {
    } else if (yield eatMatch(m`<ExportDeclaration 'export' />`)) {
    } else if (yield eatMatch(m`<ClassDeclaration 'class' />`)) {
    } else if (yield eatMatch(m`<VariableDeclarationStatement /var|const|let/ />`)) {
    } else {
      yield* super.Statement(args);
    }
  }

  *JSONExpression(args) {
    if (yield eatMatch(m`<ClassExpression 'class' />`)) {
    } else if (yield eatMatch(m`<ThisExpression 'this' />`)) {
    } else if (yield eatMatch(m`<SuperExpression 'super' />`)) {
    } else if (yield eatMatch(m`<ArrowFunctionExpression '(' />`)) {
    } else {
      yield* super.JSONExpression(args);
    }
  }

  *VariableDeclarationStatement() {
    yield eat(m`sigilToken: <*Keyword /var|const|let/ />`);

    let sep = true;
    while (sep) {
      yield eatMatch(m`declarations[]: <VariableDeclarator />`);
      sep = yield eatMatch(m`separatorTokens[]: <*Punctuator ',' />`);
    }

    yield eatMatch(m`endToken: <*Punctuator ';' />`, null, o({ bind: true }));
  }

  *ForStatement() {
    yield eat(m`sigilToken: <*Keyword 'for' />`);
    yield eat(m`openHeaderToken: <*Punctuator '(' { balanced: ')' } />`);
    if (!(yield eatMatch(m`init+$: <VariableDeclarationStatement />`, o({ noSemi: true })))) {
      yield eatMatch(m`init+$: <_Expression />`, o({ noIn: true }));
    }
    let source = yield eatMatch(m`inToken: <*Keyword /in|of/ />`, o({}), o({ bind: true }));
    if (source) {
      yield eatMatch(m`source+$: <_Expression />`);
    } else {
      yield eat(m`testSeparatorToken: <*Punctuator ';' />`);
      yield eatMatch(m`test+$: <_Expression />`);
      yield eat(m`updateSeparatorToken: <*Punctuator ';' />`);
      yield eatMatch(m`update+$: <_Expression />`);
    }
    yield eat(m`closeHeaderToken: <*Punctuator ')' { balancer: true } />`);
    yield eat(m`body: <_Statement />`);
  }

  *VariableDeclarator() {
    if (yield match('{')) {
      yield eat(m`target: <ObjectPattern />`);
    } else {
      yield eat(m`target: <Identifier />`);
    }

    if (yield match('=')) {
      yield eat(m`assignmentOperator: <*Punctuator '=' />`);
      yield eat(m`value+$: <_Expression />`, o({ power: 32 }));
    } else {
      yield eat(m`assignmentOperator: null`);
      yield eat(m`value+$: null`);
    }
  }

  *Property() {
    if (yield match(re`/['"]/`)) {
      yield eat(m`key$: <String />`);
      yield eat(m`mapOperator: <*Punctuator ':' />`);
      yield eat(m`value+$: <_Expression />`, o({ power: 32 }));
    } else if (yield eatMatch(m`key$: <Identifier />`)) {
      let cn = yield eatMatch(m`mapOperator: <*Punctuator ':' />`, null, o({ bind: true }));
      if (cn) {
        yield eat(m`value+$: <_Expression />`, o({ power: 32 }));
      } else {
        yield eatMatch(m`value+$: <FunctionExpression />`, o({ shorthand: true }));
      }
    }
  }
};

export const grammar = triviaEnhancer(
  {
    triviaIsAllowed: (s) => s.span === 'Bare',
    triviaMatcher: m`#: <__Trivia /[ \n\r\t]|\/\/|\/\*/ />`,
  },
  atrivialGrammar,
);
