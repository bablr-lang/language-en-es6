import {
  eat,
  eatMatch,
  shiftMatch,
  match,
  o,
  r,
  m,
  getInstrMatcher,
  startSpan,
  endSpan,
  startSubspan,
  shift,
} from '@bablr/helpers/grammar';

import { triviaEnhancer } from '@bablr/helpers/trivia';
import * as BList from '@bablr/agast-helpers/b-list';
import * as BListKeyed from '@bablr/agast-helpers/b-map';
import * as BSet from '@bablr/agast-helpers/b-set';

import Space from '@bablr/language-en-blank-space';
import Comment from '@bablr/language-en-c-comments';
import { default as ES5, unaryPrefixOperatorAlternatives } from '@bablr/language-en-es5';
import classMixin from './mixins/class.js';
import importMixin from './mixins/import.js';
import functionMixin from './mixins/function.js';
import stringMixin from './mixins/string.js';
import { writePattern } from '@bablr/helpers/builders';
import Regex from './regex.js';
import { getRoot, printSource } from '@bablr/agast-helpers/tree';
import { parseObject } from '@bablr/agast-helpers/parsers';
import { printSource as printStreamSource } from '@bablr/agast-helpers/stream';
import { freeze, freezeClass, freezeRecord } from '@bablr/agast-helpers/object';
import { arrayValues } from '@bablr/agast-helpers/iterable';

export const dependencies = freeze({ Comment, Space, Regex });

export {
  reservedWords,
  assignmentOperators,
  assignmentOperatorAlternatives,
  unaryPrefixOperators,
  unaryPrefixOperatorAlternatives,
  unaryPostfixOperators,
  unaryPostfixOperatorAlternatives,
  getBinaryOperatorAlternatives,
  startsIdentifierPattern,
} from '@bablr/language-en-es5';

export const canonicalURL = 'https://bablr.org/languages/universe/en/es6';

export const defaultMatcher = m`_+: <_Expression />`;

export const fragmentProduction = 'Fragment';

let unaryMatcher;

class ES6Atrivial extends importMixin(classMixin(functionMixin(stringMixin(ES5.atrivial)))) {
  static context = freezeRecord({
    ...super.context,
    assignables: freezeRecord([...arrayValues(super.context.assignables), 'CapturePattern']),
  });

  constructor() {
    super();
    this.emptyables = BSet.add('Statement', this.emptyables || BSet.create());
  }

  *Expression(args) {
    let {
      props: { noIn = false },
      getState,
    } = args;
    let { powers } = this.constructor.context;
    let power = args.props.power || powers.comma;
    let s = getState();
    let yieldPower = 0; // TODO fixme
    let awaitPower = 0;

    let sigil;
    let res;
    if (!s.shifted) {
      sigil = yield match(
        m`/[\u0060({['"/\d]|(?:yield|async|await|import|function|class|super|new|this|true|false|null|Infinity|NaN)\b/`,
      );

      let chr = printSource(sigil);

      if (!res) {
        switch (chr) {
          case '`':
            res = yield eat(m`<TemplateString />`);
            break;
          case '/':
            res = yield eat(m`:Regex: <Pattern />`, o({}), o({ held: 'eat' }));
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
          case 'async':
            if ((res = yield eatMatch(m`<FunctionExpression />`))) {
            } else {
              res = yield eat(m`<ArrowFunctionExpression />`);
            }

            break;
          case 'await':
            if (power > awaitPower) {
              res = yield eatMatch(m`<AwaitExpression />`);
            }
            break;
          case 'function':
            res = yield eat(m`<FunctionExpression />`);
            break;
          case 'class':
            res = yield eat(m`<ClassExpression />`);
            break;
          case 'import':
            res = yield eat(m`<ImportExpression />`);
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
                (unaryMatcher ??= m`<UnaryExpression ${printStreamSource(
                  writePattern(unaryPrefixOperatorAlternatives),
                )} />`),
              ))
            ) {
            } else {
              res = yield eat(m`<*Identifier />`);
            }
          }
        }
      }
    } else if ((res = yield eatMatch(m`<TemplateString '\u0060' />`))) {
    } else {
      res = yield eat(m`<_LogicExpression />`, o({ power, noIn }));
    }
    if (res && !(yield match(m`/$/`))) {
      return r(shiftMatch(m`<_Expression />`, o({ power })));
    }
  }

  *Statement(args) {
    let res = yield match(m`/import|export|class|var|const|let|async/`);
    switch (printSource(res)) {
      case 'import':
        yield eat(m`<ImportDeclaration />`);
        break;
      case 'export':
        yield eat(m`<ExportDeclaration />`);
        break;
      case 'class':
        yield eat(m`<ClassDeclaration />`);
        break;
      case 'async':
        if (yield eatMatch(m`<FunctionDeclaration />`)) {
        } else {
          yield eat(m`<ExpressionStatement />`);
        }
        break;
      case 'var':
      case 'const':
      case 'let':
        yield eat(m`<VariableDeclaration />`);
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

  *VariableDeclaration() {
    yield eat(m`sigilToken*: <*Keyword /var|const|let/ />`);

    let sep = true;
    while (sep) {
      yield eatMatch(m`declarations[]*: <VariableDeclarator />`);
      sep = yield eatMatch(m`#separatorTokens: <* ',' />`);
    }
  }

  *For() {
    yield eat(m`sigilToken*: <*Keyword 'for' />`);
    yield eat(m`openHeaderToken*: <* '(' />`);
    yield startSpan('Bare', ')');

    yield startSubspan(null, m`/;|of|in/`);
    if (!(yield eatMatch(m`init+$: <VariableDeclaration />`))) {
      yield eatMatch(m`init+$: <_Expression />`, o({ noIn: true }));
    }
    yield endSpan();
    let source = yield eatMatch(m`inToken*: <*Keyword /in|of/ />`);
    if (source) {
      yield eatMatch(m`source+$: <_Expression />`);
    } else {
      yield eat(m`testSeparatorToken*: <* ';' />`);
      yield startSpan('Bare', ';');
      yield eatMatch(m`test+$: <_Expression />`);
      yield endSpan();
      yield eat(m`updateSeparatorToken*: <* ';' />`);
      yield eatMatch(m`update+$: <_Expression />`);
    }
    yield endSpan();
    yield eat(m`closeHeaderToken*: <* ')' />`);
    yield eat(m`body*: <_Statement />`);
  }

  *VariableDeclarator() {
    if (yield match(m`'{'`)) {
      yield eat(m`receiver*: <ObjectPattern />`);
    } else {
      yield eat(m`receiver*: <*Identifier />`);
    }

    if (yield match(m`'='`)) {
      yield eat(m`assignmentToken*: <* '=' />`);
      yield startSubspan(null, ',');
      yield eat(m`value+$: <_Expression />`);
      yield endSpan();
    } else {
      yield eat(m`value+$: null`);
    }
  }

  *ImportExpression() {
    yield eat(m`sigilToken*: <*Keyword 'import' />`);
    yield eat(m`openToken*: <* '(' />`);
    yield eat(m`source+$: <_Expression />`);
    yield eat(m`closeToken*: <* ')' />`);
  }

  *ObjectKey() {
    if (yield eatMatch(m`<String /['"]/ />`)) {
    } else if (yield eatMatch(m`<*UnsignedInteger /\d/ />`)) {
    } else if (yield eatMatch(m`<ComputedObjectKey '[' />`)) {
    } else {
      yield eat(m`<*Identifier />`, o({ scoped: false }));
    }
  }

  *ComputedObjectKey() {
    yield eat(m`openToken*: <* '[' />`);
    yield startSpan('Bare', ']');
    yield eat(m`name+$: <_Expression />`);
    yield endSpan();
    yield eat(m`closeToken*: <* ']' />`);
  }

  *Method(args) {
    let { s } = args;
    let asyncToken = yield match(m`'async'`);
    let isSyncMethod =
      s().shifted || (yield match(m`isSyncMethod*: <All />`, [(m`<* 'async' />`, m`<* '(' />`)]));

    if (!asyncToken || !isSyncMethod) {
      yield* super.Method(args);
    } else {
      let iter = super.Method(args);
      let step = iter.next();
      while (!step.done) {
        let instr = step.value;
        let refName = getInstrMatcher(instr)?.reference.value.name;
        if (refName === 'asyncToken') {
          step = iter.next(null);
        } else {
          step = iter.next(yield instr);
        }
      }
    }
  }

  *ObjectElement() {
    let asyncToken = yield match(m`'async'`);
    let starToken = yield match(m`'*'`);
    let isMethod =
      starToken ||
      (asyncToken && !(yield match(m`<All />`, freezeRecord([m`<* 'async' />`, m`<* /[(:]/ />`]))));

    if (isMethod) {
      yield eat(m`value+: <Method />`);
    } else {
      if (yield eatMatch(m`value+: <SpreadElement '...' />`)) {
      } else {
        yield eat(m`value+: <_ObjectKey />`);

        if (yield shiftMatch(m`<Property ':' />`)) {
        } else if (yield shiftMatch(m`<Method '(' />`)) {
        } else {
          yield shift(m`<Property />`);
        }
      }
    }
    yield eatMatch(m`separatorToken*: <* ',' />`);
  }

  *Property({ s }) {
    let shifted = getRoot(s().shifted);
    yield eat(m`key$: <_ObjectKey />`, o({}), o({ held: 'eat' }));
    let firstToken = printSource(
      shifted.value.flags.token
        ? shifted
        : BList.getAt(1, shifted.value.bounds.leading).property.value.node,
    );
    let isIndex = /\d/.test(firstToken[0]);
    let isComputed = firstToken === '[';

    let cn =
      isIndex || isComputed || shifted.value.name === Symbol.for('Keyword')
        ? yield eat(m`mapOperator*: <* ':' />`)
        : yield eatMatch(m`mapOperator*: <* ':' />`);
    if (cn) {
      yield startSubspan(null, ',');
      yield eat(m`value+$: <_Expression />`);
      yield endSpan();
    }
  }

  *ArrayElement() {
    if (yield eatMatch(m`<SpreadElement '...' />`)) {
    } else {
      yield startSubspan(null, ',');
      yield eat(m`value+$: <_Expression />`);
      yield endSpan();
      yield eatMatch(m`separatorToken*: <* ',' />`);
    }
  }

  *SpreadElement() {
    yield eat(m`sigilToken*: <* '...' />`);
    yield eat(m`value+$: <_Expression />`);
  }
}

freezeClass(ES6Atrivial);

export default triviaEnhancer(
  {
    triviaIsAllowed: (s) => s.span.name === 'Bare',

    *Trivia({ s }) {
      let span = BListKeyed.get('Trivia', s().spans);

      let spaces = (span && parseObject(span.props).spaces) ?? Infinity;

      yield startSpan('Trivia', null, span?.props);
      let res = yield match(m`/\/\/|\/\*|[ \t][^ \t\r\n\g/]|[ \n\r\t]/`);

      if (res) {
        res = printSource(res);
      }

      if (res && ' \t'.includes(res[0]) && res.length === 2 && spaces > 1) {
        yield eat(m`#: <* ' ' />`, o({}), o({ hold: true }));
      } else {
        yield eat(m`#: <Trivia />`, o({}), o({ hold: true }));
      }
      yield endSpan();
    },
  },
  ES6Atrivial,
);
