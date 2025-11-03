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
import { buildPattern } from '@bablr/helpers/builders';
import { reservedWords, unaryPrefixOperatorAlternatives } from '@bablr/language-en-es5';
import * as Regex from './regex.js';

export const dependencies = { Comment, Space, Regex };

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

let reservedWords_ = new Set(reservedWords);

export const canonicalURL = 'https://bablr.org/languages/universe/es6';

export const defaultMatcher = m`.+$: <_Expression />`;

let unaryMatcher;

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

    let sigil;
    let res;
    if (!s.holding) {
      sigil = yield match(
        re`/[\u0060({['"/\d]|(?:yield|function|class|super|new|this|true|false|null|Infinity|NaN)\b/`,
      );
      switch (args.ctx.sourceTextFor(sigil)) {
        case '`':
          res = yield eat(m`<TemplateString />`);
          break;
        case '/':
          res = yield eat(m`:Regex: <Pattern />`);
          break;
        case '(':
          if ((res = yield eatMatch(m`<ArrowFunctionExpression />`))) {
          } else {
            res = yield eat(m`<ParenthesisExpression />`);
          }
          break;
        case 'yield':
          if (power > yieldPower) {
            res = yield eatMatch(m`<YieldExpression />`);
          }
          break;
        case 'function':
          res = yield eat(m`<FunctionExpression />`);
          break;
        case 'class':
          res = yield eat(m`<ClassExpression />`);
          break;
        case 'super':
          res = yield eat(m`<SuperExpression />`);
          break;
        case 'true':
        case 'false':
        case 'null':
        case 'Infinity':
        case 'NaN':
        case '[':
        case '{':
        case '"':
        case "'":
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          res = yield eat(m`<_JSONExpression  />`);
          break;

        case 'new':
          if (power >= 4) {
            res = yield eatMatch(m`<NewExpression />`, o({ power }));
          }
          break;

        case 'this':
          res = yield eatMatch(m`<ThisExpression />`, o({ power }));
          break;

        default: {
          if (
            power >= 4 &&
            (res = yield eatMatch(
              (unaryMatcher ??= m`<UnaryExpression ${buildPattern(
                unaryPrefixOperatorAlternatives,
              )} />`),
            ))
          ) {
          } else {
            res = yield eat(m`<Identifier />`);
          }
        }
      }
    } else if ((res = yield eatMatch(m`<TemplateString '\u0060' />`))) {
    } else {
      res = yield eat(m`<_LogicExpression />`, o({ power, noIn }));
    }
    if (res) {
      return r(shiftMatch(m`<_Expression />`, o({ power })));
    }
  }

  *Statement(args) {
    let res = yield match(re`/import|export|class|var|const|let/`);
    switch (args.ctx.sourceTextFor(res)) {
      case 'import':
        yield eat(m`<ImportDeclaration />`);
        break;
      case 'export':
        yield eat(m`<ExportDeclaration />`);
        break;
      case 'class':
        yield eat(m`<ClassDeclaration />`);
        break;
      case 'var':
      case 'const':
      case 'let':
        yield eat(m`<VariableDeclarationStatement />`);
        break;
      default:
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
    yield eat(m`sigilToken*: <*Keyword /var|const|let/ />`);

    let sep = true;
    while (sep) {
      yield eatMatch(m`declarations[]*: <VariableDeclarator />`);
      sep = yield eatMatch(m`#separatorTokens[]: <*Punctuator ',' />`);
    }

    yield eatMatch(m`endToken*: <*Punctuator ';' />`, null, o({ bind: true }));
  }

  *ForStatement() {
    yield eat(m`sigilToken*: <*Keyword 'for' />`);
    yield eat(m`openHeaderToken*: <*Punctuator '(' { balanced: ')' } />`);
    if (!(yield eatMatch(m`init+$: <VariableDeclarationStatement />`, o({ noSemi: true })))) {
      yield eatMatch(m`init+$: <_Expression />`, o({ noIn: true }));
    }
    let source = yield eatMatch(m`inToken*: <*Keyword /in|of/ />`, o({}), o({ bind: true }));
    if (source) {
      yield eatMatch(m`source+$: <_Expression />`);
    } else {
      yield eat(m`testSeparatorToken*: <*Punctuator ';' />`);
      yield eatMatch(m`test+$: <_Expression />`);
      yield eat(m`updateSeparatorToken*: <*Punctuator ';' />`);
      yield eatMatch(m`update+$: <_Expression />`);
    }
    yield eat(m`closeHeaderToken*: <*Punctuator ')' { balancer: true } />`);
    yield eat(m`body*: <_Statement />`);
  }

  *VariableDeclarator() {
    if (yield match('{')) {
      yield eat(m`target*: <ObjectPattern />`);
    } else {
      yield eat(m`target*: <Identifier />`);
    }

    if (yield match('=')) {
      yield eat(m`assignmentOperator*: <*Punctuator '=' />`);
      yield eat(m`value+$: <_Expression />`, o({ power: 32 }));
    } else {
      yield eat(m`assignmentOperator*: null`);
      yield eat(m`value+$: null`);
    }
  }

  *Property({ ctx }) {
    let index, key, openId;
    if (yield eatMatch(m`key$: <String /['"]/ />`)) {
      yield eat(m`mapOperator*: <*Punctuator ':' />`);
      yield eat(m`value+$: <_Expression />`, o({ power: 32 }));
    } else if (
      (openId = yield eatMatch(
        m`openIdToken*: <*Punctuator '[' { balanced: ']' } />`,
        o({}),
        o({ bind: true }),
      )) ||
      (index = yield eatMatch(m`key$: <UnsignedInteger /\d/ />`)) ||
      (key = yield eatMatch(m`key$: <Identifier />`, o({ scoped: false })))
    ) {
      if (openId) {
        yield eat(m`id+$: <_Expression />`);
        yield eat(m`closeIdToken*: <*Punctuator ']' { balancer: true } />`);
      }
      let cn =
        index || reservedWords_.has(ctx.sourceTextFor(key))
          ? yield eat(m`mapOperator*: <*Punctuator ':' />`, null, o({ bind: true }))
          : yield eatMatch(m`mapOperator*: <*Punctuator ':' />`, null, o({ bind: true }));
      if (cn) {
        yield eat(m`value+$: <_Expression />`, o({ power: 32 }));
      } else {
        yield eatMatch(m`value+$: <FunctionExpression />`, o({ shorthand: true }));
      }
    }
  }

  *Element() {
    if (yield eatMatch(m`<SpreadElement '...' />`)) {
    } else {
      let { value } = yield eat(m`<_Expression />`, o({ power: 32 }), o({ shift: false }));
      return value;
    }
  }

  *SpreadElement() {
    yield eat(m`sigilToken*: <*Punctuator '...' />`);
    yield eat(m`value+$: <_Expression />`, o({ power: 32 }));
  }
};

export const grammar = triviaEnhancer(
  {
    triviaIsAllowed: (s) => s.span === 'Bare',
    triviaMatcher: m`#: <__Trivia /[ \n\r\t]|\/\/|\/\*/ />`,
  },
  atrivialGrammar,
);
