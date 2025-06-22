import compileModule from '../../../utils/compileModule';
import pkg from 'tree-gex/package.json';

const ID = 'tree-gex';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  defaultParserID: 'babel-eslint',

  loadTransformer(callback) {
    require(['../../../transpilers/babel', 'tree-gex/dist/index.cjs'], (transpile, treeGex) => {
      callback({ transpile: transpile.default, treeGex});
    });
  },

  transform({ transpile, treeGex }, transformCode, code, ast) {
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
    if (!transform.default) return '';
    let match = null;
    if ('range' in transform.default) {
      match = { node: transform.default, range: transform.default.range };
    }
    return {
      code: JSON.stringify(transform.default, null, 2),
      match,
    };
  },
};
