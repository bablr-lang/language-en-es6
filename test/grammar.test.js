import { spam } from '@bablr/boot';
import { dedent } from '@qnighy/dedent';
// eslint-disable-next-line import/no-unresolved
import language from '@bablr/language-en-es6';
import { buildTag } from 'bablr';
import { debugEnhancers } from '@bablr/helpers/enhancers';
import { expect } from 'expect';
import { printPrettyCSTML } from '@bablr/helpers/tree';
import { buildIdentifier } from '@bablr/helpers/builders';

let enhancers = undefined;

const buildJSTag = (type) => {
  const matcher = spam`<$${buildIdentifier(type)} />`;
  return buildTag(language, matcher, undefined, { enhancers });
};

const print = (tree) => {
  return printPrettyCSTML(tree);
};

describe('@bablr/language-en-es6', () => {
  describe('Program', () => {
    const js = buildJSTag('Program');

    it('js`import foo from "bar"`', () => {
      expect(print(js`import foo from "bar"`)).toEqual(dedent`<$Program>
          body[]:
          <$ImportDeclaration>
            sigilToken*: <*Keyword 'import' />
            #: :Space: <*Space ' ' />
            specifiers[]:
            <$ImportDefaultSpecifier>
              local*:
              <$Identifier>
                value*: <*Literal 'foo' />
              </>
            </>
            #: :Space: <*Space ' ' />
            openSpecifiersToken*: null
            closeSpecifiersToken*: null
            fromToken*: <*Keyword 'from' />
            #: :Space: <*Space ' ' />
            source:
            <$String>
              openToken*: <* '"' { balanced: '"', balancedSpan: 'String:Double' } />
              content: <*StringContent 'bar' />
              closeToken*: <* '"' { balancer: true } />
            </>
            endToken*: null
          </>
        </>\n`);
    });

    it('js`export food, {stuff} from "bar";`', () => {
      expect(print(js`export food, {stuff} from "bar";`)).toEqual(dedent`<$Program>
          body[]:
          <$ExportDeclaration>
            sigilToken*: <*Keyword 'export' />
            #: :Space: <*Space ' ' />
            defaultToken*: null
            specifiers[]:
            <$ExportDefaultSpecifier>
              local:
              <$Identifier>
                value*: <*Literal 'food' />
              </>
            </>
            #separatorTokens[]: <* ',' />
            #: :Space: <*Space ' ' />
            openSpecifiersToken*: <* '{' { balanced: '}' } />
            specifiers[]:
            <$ExportSpecifier>
              local:
              <$Identifier>
                value*: <*Literal 'stuff' />
              </>
              mapOperator*: null
              imported: null
            </>
            closeSpecifiersToken*: <* '}' { balancer: true } />
            #: :Space: <*Space ' ' />
            fromToken*: <*Keyword 'from' />
            #: :Space: <*Space ' ' />
            source:
            <$String>
              openToken*: <* '"' { balanced: '"', balancedSpan: 'String:Double' } />
              content: <*StringContent 'bar' />
              closeToken*: <* '"' { balancer: true } />
            </>
            endToken*: <* ';' />
          </>
        </>\n`);
    });
  });
});
