import { dedent } from '@qnighy/dedent';
// eslint-disable-next-line import/no-unresolved
import language from '@bablr/language-en-es6';
import { buildTag } from 'bablr';
import { expect } from 'expect';
import { printPrettyCSTML } from '@bablr/helpers/tree';
import { m } from '@bablr/helpers/grammar';

let enhancers = undefined;

const buildJSTag = (type) => {
  const matcher = m`<$${type} />`;
  return buildTag(language, matcher, undefined, { enhancers });
};

const print = (tree) => {
  return printPrettyCSTML(tree);
};

describe('@bablr/language-en-es6', () => {
  describe('Program', () => {
    const js = buildJSTag('Program');

    it('js`import foo from "bar"`', () => {
      expect(print(js`import foo from "bar"`)).toEqual(dedent`
        <$_>
          _:
          <$Program>
            body[]$:
            <$ImportDeclaration>
              sigilToken*: <*Keyword 'import' />
              #: <* ' ' />
              specifiers[]$:
              <$ImportDefaultSpecifier>
                local*: <*Identifier 'foo' />
              </>
              #: <* ' ' />
              fromToken*: <*Keyword 'from' />
              #: <* ' ' />
              source$:
              <$String>
                openToken*: <* '"' />
                content$: <*StringContent 'bar' />
                closeToken*: <* '"' />
              </>
            </>
          </>
        </>\n`);
    });

    it('js`export {stuff} from "bar";`', () => {
      expect(print(js`export {stuff} from "bar";`)).toEqual(dedent`
        <$_>
          _:
          <$Program>
            body[]$:
            <$ExportDeclaration>
              sigilToken*: <*Keyword 'export' />
              #: <* ' ' />
              openSpecifiersToken*: <* '{' />
              specifiers[]$:
              <$ExportSpecifier>
                local$: <*Identifier 'stuff' />
                imported$: null
              </>
              closeSpecifiersToken*: <* '}' />
              #: <* ' ' />
              fromToken*: <*Keyword 'from' />
              #: <* ' ' />
              source$:
              <$String>
                openToken*: <* '"' />
                content$: <*StringContent 'bar' />
                closeToken*: <* '"' />
              </>
            </>
            #separatorTokens: <* ';' />
          </>
        </>\n`);
    });
  });
});
