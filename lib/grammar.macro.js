import { re, spam as m } from '@bablr/boot';
import { AllowEmpty, CoveredBy, Node } from '@bablr/helpers/decorators';
import { eat, eatMatch, o } from '@bablr/helpers/grammar';
import { triviaEnhancer } from '@bablr/helpers/trivia';
import * as Comment from '@bablr/language-en-c-comments';
import * as es5 from '@bablr/language-en-es5';
import { mixin as classMixin } from './mixins/class.js';
import { mixin as importMixin } from './mixins/import.js';

export const dependencies = { Comment };

export const canonicalURL = 'https://bablr.org/languages/universe/es6';

export const atrivialGrammar = class ES6Grammar extends importMixin(
  classMixin(es5.atrivialGrammar),
) {
  @AllowEmpty
  *Statement(args) {
    if (yield eatMatch(m`<ImportDeclaration 'import' />`)) {
    } else if (yield eatMatch(m`<ExportDeclaration 'export' />`)) {
    } else {
      yield* super.Statement(args);
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
