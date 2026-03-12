import { re, spam as m } from '@bablr/boot';
import {
  eat,
  eatMatch,
  shiftMatch,
  match,
  o,
  r,
  shift,
  getInstrMatcher,
  startSpan,
  endSpan,
  startSubspan,
} from '@bablr/helpers/grammar';
import * as Spans from '@bablr/agast-helpers/spans';
import { triviaEnhancer } from '@bablr/helpers/trivia';
import * as BTree from '@bablr/agast-helpers/btree';
import Space from '@bablr/language-en-blank-space';
import Comment from '@bablr/language-en-c-comments';
import { default as es5, unaryPrefixOperatorAlternatives } from '@bablr/language-en-es5';
import classMixin from './mixins/class.js';
import importMixin from './mixins/import.js';
import functionMixin from './mixins/function.js';
import stringMixin from './mixins/string.js';
import { buildPattern } from '@bablr/helpers/builders';
import Regex from './regex.js';
import { getRoot, printSource } from '@bablr/agast-helpers/tree';
import { reifyMatcherReferenceName } from '@bablr/agast-vm-helpers';
import { Coroutine } from '@bablr/coroutine';

export const dependencies = { Comment, Space, Regex };

let runCo = (generator) => new Coroutine(generator).advance();

export {
  reservedWords,
  assignmentOperators,
  assignmentOperatorAlternatives,
  unaryPrefixOperators,
  unaryPrefixOperatorAlternatives,
  unaryPostfixOperators,
  unaryPostfixOperatorAlternatives,
  getBinaryOperatorAlternatives,
} from '@bablr/language-en-es5';

export const canonicalURL = 'https://bablr.org/languages/universe/en/es6';

export const defaultMatcher = m`_+: <_Expression />`;

export const fragmentProduction = 'Fragment';

let unaryMatcher;

const atrivial = class ES6Grammar extends importMixin(
  classMixin(functionMixin(stringMixin(es5.grammar.atrivial))),
) {
  static get assignables() {
    return [...super.assignables, 'CapturePattern'];
  }

  constructor() {
    super();
    this.emptyables = new Set([...(this.emptyables || []), 'Statement']);
  }

  *Expression(args) {
    let {
      props: { noIn = false },
      getState,
    } = args;
    let { powers } = this.constructor;
    let power = args.props.power || powers.comma;
    let s = getState();
    let yieldPower = 0; // TODO fixme
    let awaitPower = 0;

    let sigil;
    let res;
    if (!s.shifted) {
      sigil = yield match(
        re`/[\u0060({['"/\d]|(?:yield|await|function|class|super|new|this|true|false|null|Infinity|NaN)\b/`,
      );

      let chr = printSource(sigil);

      if (chr === '{') {
        res = yield eatMatch(m`<CapturePattern />`);
      }

      if (!res) {
        switch (chr) {
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
      }
    } else if ((res = yield eatMatch(m`<TemplateString '\u0060' />`))) {
    } else {
      res = yield eat(m`<_LogicExpression />`, o({ power, noIn }));
    }
    if (res && !(yield match(re`/$/`))) {
      return r(shiftMatch(m`<_Expression />`, o({ power })));
    }
  }

  *Statement(args) {
    let res = yield match(re`/import|export|class|var|const|let|async/`);
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
        yield eat(m`<FunctionDeclaration />`);
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

  *VariableDeclaration({ props: { noSemi = false } }) {
    yield eat(m`sigilToken*: <*Keyword /var|const|let/ />`);

    let sep = true;
    while (sep) {
      yield eatMatch(m`declarations[]*: <VariableDeclarator />`);
      sep = yield eatMatch(m`#separatorTokens: <* ',' />`);
    }

    // if (!noSemi) {
    //   yield eatMatch(m`endToken*: <* ';' />`);
    // }
  }

  *For() {
    yield eat(m`sigilToken*: <*Keyword 'for' />`);
    yield eat(m`openHeaderToken*: <* '(' />`);
    yield startSpan('Bare', ')');

    yield startSubspan(null, re`/;|of|in/`);
    if (!(yield eatMatch(m`init+$: <VariableDeclaration />`, o({ noSemi: true })))) {
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
    if (yield match('{')) {
      yield eat(m`receiver*: <ObjectPattern />`);
    } else {
      yield eat(m`receiver*: <Identifier />`);
    }

    if (yield match('=')) {
      yield eat(m`assignmentToken*: <* '=' />`);
      yield eat(m`value+$: <_Element />`);
    } else {
      yield eat(m`value+$: null`);
    }
  }

  *ObjectKey() {
    if (yield eatMatch(m`<String /['"]/ />`)) {
    } else if (yield eatMatch(m`<UnsignedInteger /\d/ />`)) {
    } else if (yield eatMatch(m`<ComputedObjectKey '[' />`)) {
    } else {
      yield eat(m`<Identifier />`, o({ scoped: false }));
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
    let asyncToken = yield match('async');
    let isSyncMethod =
      s().shifted || (yield match(m`isSyncMethod*: <All />`, [(m`<* 'async' />`, m`<* '(' />`)]));

    if (!asyncToken || !isSyncMethod) {
      yield* super.Method(args);
    } else {
      let co = runCo(super.Method(args));
      while (!co.done) {
        let instr = co.value;
        let refName = reifyMatcherReferenceName(getInstrMatcher(instr));
        if (refName === 'asyncToken') {
          co.advance(null);
        } else {
          co.advance(yield instr);
        }
      }
    }
  }

  *ObjectElement({ s }) {
    if (s().shifted) {
      if (yield eatMatch(m`<Property ':' />`)) {
      } else {
        yield eatMatch(m`<Method '(' />`);
      }
    } else {
      if (yield eatMatch(m`<SpreadElement '...' />`)) {
      } else {
        let asyncToken = yield match('async');
        let starToken = yield match('*');
        let isMethod =
          starToken ||
          (asyncToken && !(yield match(m`<All />`, [m`<* 'async' />`, m`<* /[(:]/ />`])));

        if (isMethod) {
          yield eat(m`<Method />`);
        } else {
          yield eat(m`<_ObjectKey />`);

          if (yield match(re`/[[(:]/`)) {
            return r(shift(m`<_ObjectElement />`));
          }
        }
      }
    }
  }

  *Property({ s }) {
    let { shifted } = s();
    yield eat(m`key$: <_ObjectKey />`, o({}), o({ held: 'eat' }));
    let firstToken = printSource(
      BTree.getAt(1, getRoot(shifted).value.bounds.leading).property.value.node,
    );
    let isIndex = /\d/.test(firstToken[0]);
    let isComputed = firstToken === '[';

    let cn =
      isIndex || isComputed || getRoot(shifted).value.name === Symbol.for('Keyword')
        ? yield eat(m`mapOperator*: <* ':' />`)
        : yield eatMatch(m`mapOperator*: <* ':' />`);
    if (cn) {
      yield eat(m`value+$: <_Element />`);
    }
  }

  *ArrayElement() {
    if (yield eatMatch(m`<SpreadElement '...' />`)) {
    } else {
      yield eat(m`<_Element />`);
    }
  }

  *SpreadElement() {
    yield eat(m`sigilToken*: <* '...' />`);
    yield eat(m`value+$: <_Element />`);
  }
};

export const grammar = triviaEnhancer(
  {
    triviaIsAllowed: (s) => s.span.name === 'Bare',

    *Trivia({ s }) {
      let span = Spans.getSpan('Trivia', s().spans);

      let spaces = span?.props.spaces ?? Infinity;

      yield startSpan('Trivia', null, span?.props);
      let res = yield match(re`/\/\/|\/\*|[ \t][^ \t\r\n]|[ \n\r\t]/`);

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
  atrivial,
);

export default { canonicalURL, dependencies, grammar, defaultMatcher, fragmentProduction };
