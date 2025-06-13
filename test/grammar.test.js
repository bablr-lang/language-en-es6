import { spam } from '@bablr/boot';
import { dedent } from '@qnighy/dedent';
// eslint-disable-next-line import/no-unresolved
import * as language from '@bablr/language-en-es6';
import { buildTag } from 'bablr';
import { debugEnhancers } from '@bablr/helpers/enhancers';
import { expect } from 'expect';
import { printPrettyCSTML } from '@bablr/helpers/tree';
import { buildIdentifier, buildString } from '@bablr/helpers/builders';

let enhancers = undefined;

const buildJSTag = (type) => {
  const matcher = spam`<$${buildIdentifier(type)} />`;
  return buildTag(language, matcher, undefined, { enhancers });
};

const print = (tree) => {
  return printPrettyCSTML(tree.node);
};

describe('@bablr/language-en-es6', () => {
  describe('Program', () => {
    const js = buildJSTag('Program');

    it('js`import foo from "bar"`', () => {
      expect(print(js`import foo from "bar"`)).toEqual(dedent`\
        <!0:cstml { bablrLanguage: 'https://bablr.org/languages/universe/es6' }>
        <$_>
          .:
          <$Program>
            body[]: []
            body[]:
            <$ImportDeclaration>
              sigilToken: <*Keyword 'import' />
              #: :Comment.Space: <*Space ' ' />
              specifiers[]$: []
              specifiers[]$:
              <$ImportDefaultSpecifier>
                local:
                <$Identifier>
                  value: <*Literal 'foo' />
                  #: :Comment.Space: <*Space ' ' />
                </>
              </>
              openSpecifiersToken: null
              closeSpecifiersToken: null
              fromToken: <*Keyword 'from' />
              #: :Comment.Space: <*Space ' ' />
              source$:
              <$String>
                open: <*Punctuator '"' { balanced: '"', balancedSpan: 'String:Double' } />
                content: <*StringContent 'bar' />
                close: <*Punctuator '"' { balancer: true } />
              </>
              endToken: null
            </>
          </>
        </>\n`);
    });

    it('js`export food, {stuff} from "bar";`', () => {
      expect(print(js`export food, {stuff} from "bar";`)).toEqual(dedent`\
        <!0:cstml { bablrLanguage: 'https://bablr.org/languages/universe/es6' }>
        <$_>
          .:
          <$Program>
            body[]: []
            body[]:
            <$ExportDeclaration>
              sigilToken: <*Keyword 'export' />
              declaration$: undefined
              defaultToken: null
              #: :Comment.Space: <*Space ' ' />
              specifiers[]$: []
              specifiers[]$:
              <$ExportDefaultSpecifier>
                local$:
                <$Identifier>
                  value: <*Literal 'food' />
                </>
              </>
              specifierSeparatorTokens[]: []
              specifierSeparatorTokens[]: <*Punctuator ',' />
              #: :Comment.Space: <*Space ' ' />
              openSpecifiersToken: <*Punctuator '{' { balanced: '}' } />
              specifiers[]$:
              <$ExportSpecifier>
                local$:
                <$Identifier>
                  value: <*Literal 'stuff' />
                </>
                mapOperator: null
                imported$: null
              </>
              closeSpecifiersToken: <*Punctuator '}' { balancer: true } />
              #: :Comment.Space: <*Space ' ' />
              fromToken: <*Keyword 'from' />
              #: :Comment.Space: <*Space ' ' />
              source$:
              <$String>
                open: <*Punctuator '"' { balanced: '"', balancedSpan: 'String:Double' } />
                content: <*StringContent 'bar' />
                close: <*Punctuator '"' { balancer: true } />
              </>
              endToken: <*Punctuator ';' />
              declaration$: null
            </>
          </>
        </>\n`);
    });
  });
});
