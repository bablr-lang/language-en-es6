import { re, spam as m } from '@bablr/boot';
import { AllowEmpty, CoveredBy, Node } from '@bablr/helpers/decorators';
import { eat, eatMatch, shiftMatch, match, o } from '@bablr/helpers/grammar';
import { triviaEnhancer } from '@bablr/helpers/trivia';
import * as Comment from '@bablr/language-en-c-comments';
import * as es5 from '@bablr/language-en-es5';
import { mixin as classMixin } from './mixins/class.js';
import { mixin as importMixin } from './mixins/import.js';
import { mixin as functionMixin } from './mixins/function.js';
import { buildPattern } from '@bablr/helpers/builders';
import { unaryPrefixOperatorAlternatives } from '@bablr/language-en-es5';

export const dependencies = { Comment };

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

export const atrivialGrammar = class ES6Grammar extends importMixin(
  classMixin(functionMixin(es5.atrivialGrammar)),
) {
  *Expression(args) {
    let {
      props: { power = 34, noIn = false },
      s,
    } = args;
    let res;
    if (!s.holding) {
      if ((res = yield eatMatch(m`<ArrowFunctionExpression '(' />`))) {
      } else if ((res = yield eatMatch(m`<ParenthesisExpression '(' />`))) {
      } else if ((res = yield eatMatch(m`<_JSONExpression />`))) {
      } else if ((res = yield eatMatch(m`<FunctionExpression 'function' />`))) {
      } else if (
        power >= 4 &&
        (res = yield eatMatch(
          m`<UnaryExpression ${buildPattern(unaryPrefixOperatorAlternatives)} />`,
        ))
      ) {
      } else if (power >= 4 && (res = yield eatMatch(m`<NewExpression 'new' />`, o({ power })))) {
      } else if ((res = yield eatMatch(m`<Identifier />`))) {
      }
    } else {
      if ((res = yield eatMatch(m`<ArrowFunctionExpression /\g=\>/ />`))) {
      } else {
        res = yield eatMatch(m`<_LogicExpression />`, o({ power, noIn }));
      }
    }
    if (res) {
      return shiftMatch(m`<__Expression />`, o({ power }));
    }
  }

  @AllowEmpty
  *Statement(args) {
    if (yield eatMatch(m`<ImportDeclaration 'import' />`)) {
    } else if (yield eatMatch(m`<ExportDeclaration 'export' />`)) {
    } else if (yield eatMatch(m`<ClassDeclaration 'class' />`)) {
    } else if (yield eatMatch(m`<YieldStatement 'yield' />`)) {
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

  @CoveredBy('Statement')
  @Node
  *VariableDeclarationStatement() {
    yield eat(m`sigilToken: <*Keyword /var|const|let/ />`);

    let sep = true;
    while (sep) {
      yield eatMatch(m`declarations[]: <VariableDeclarator />`);
      sep = yield eatMatch(m`separatorTokens[]: <*Punctuator ',' />`);
    }

    yield eatMatch(m`endToken: <*Punctuator ';' />`, null, o({ bind: true }));
  }

  @CoveredBy('Statement')
  @Node
  *ForStatement() {
    yield eat(m`sigilToken: <*Keyword 'for' />`);
    yield eat(m`openHeaderToken: <*Punctuator '(' { balanced: ')' } />`);
    if (!(yield eatMatch(m`init+$: <VariableDeclarationStatement />`, o({ noSemi: true })))) {
      yield eatMatch(m`init+$: <__Expression />`, o({ noIn: true }));
    }
    let source = yield eatMatch(m`inToken: <*Keyword /in|of/ />`, o({}), o({ bind: true }));
    if (source) {
      yield eatMatch(m`source+$: <__Expression />`);
    } else {
      yield eat(m`testSeparatorToken: <*Punctuator ';' />`);
      yield eatMatch(m`test+$: <__Expression />`);
      yield eat(m`updateSeparatorToken: <*Punctuator ';' />`);
      yield eatMatch(m`update+$: <__Expression />`);
    }
    yield eat(m`closeHeaderToken: <*Punctuator ')' { balancer: true } />`);
    yield eat(m`body: <__Statement />`);
  }

  @Node
  *VariableDeclarator() {
    if (yield match('{')) {
      yield eat(m`target: <ObjectPattern />`);
    } else {
      yield eat(m`target: <Identifier />`);
    }

    if (yield match(re`/=/s`)) {
      yield eat(m`assignmentOperator: <*Punctuator '=' />`);
      yield eat(m`value+$: <__Expression />`, o({ power: 32 }));
    } else {
      yield eat(m`assignmentOperator: null`);
      yield eat(m`value+$: null`);
    }
  }

  @Node
  *Property() {
    yield eat(m`key$: <Identifier />`);
    let op = yield eatMatch(m`mapOperator: <*Punctuator ':' />`, o({}), o({ bind: true }));
    if (op) {
      yield eat(m`value+$: <__Expression />`, o({ power: 32 }));
    } else {
      yield eat(m`value+$: null`);
    }
  }
};

export const grammar = triviaEnhancer(
  {
    triviaIsAllowed: (s) => s.span === 'Bare',
    triviaMatcher: m`#: :Comment: <_Trivia /[ \n\r\t]|\/\/|\/\*/ />`,
  },
  atrivialGrammar,
);
