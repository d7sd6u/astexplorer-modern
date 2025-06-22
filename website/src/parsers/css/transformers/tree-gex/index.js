import compileModule from '../../../utils/compileModule';
import pkg from 'tree-gex/package.json';

const ID = 'tree-gex';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  defaultParserID: 'postcss',

  loadTransformer(callback) {
    require(['../../../transpilers/babel', 'tree-gex/dist/index.cjs', 'postcss'], (transpile, treeGex, postcss) => {
      callback({ transpile: transpile.default, treeGex, postcss });
    });
  },

  transform({ transpile, treeGex, postcss }, transformCode, code, ast) {
    transformCode = transpile( transformCode);
    let transform = compileModule( // eslint-disable-line no-shadow
      transformCode,
      {
        require(name) {
          switch (name) {
            case 'tree-gex': return treeGex;
            case 'ast': return ast;
            case 'code': return code;
            default: throw new Error(`Cannot find module '${name}'`);
          }
        },
      },
    );
    const astToString = (ast) => {
      let res = "";
      postcss.stringify(ast, (r) => {
        res += r;
      });
      return res;
    }
    const astToRange = (ast) => {
      return [
        ast.source.start.offset,
        ast.source.end.offset + 1,
      ]
    };
    if (!transform.default) return '';
    let match = null;
    if ('source' in transform.default) {
      match = { node: transform.default, range: astToRange(transform.default) };
    }
    return {
      code: astToString(transform.default),
      match,
    };
  },
};
