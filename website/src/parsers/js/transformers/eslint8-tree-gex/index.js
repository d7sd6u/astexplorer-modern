import pkg from 'eslint8/package.json';

const ID = 'eslint-v8-tree-gex';
const name = 'ESLint v8 with tree-gex';

export default {
  id: ID,
  displayName: name,
  version: pkg.version,
  homepage: pkg.homepage,

  defaultParserID: 'babel-eslint',

  loadTransformer(callback) {
    require([
      'eslint8/lib/linter',
      'eslint8/lib/source-code',
      '../../utils/eslint4Utils',
      'tree-gex/dist/index.cjs',
    ], (Linter, sourceCode, utils, treeGex) =>
      callback({ eslint: new Linter.Linter(), sourceCode, utils, treeGex }));
  },

  transform({ eslint, sourceCode, utils, treeGex }, transformCode, code) {
    utils.defineRule(eslint, transformCode, {
      require(name) {
        switch (name) {
          case 'tree-gex':
            return treeGex;
          default:
            throw new Error(`Cannot find module '${name}'`);
        }
      },
    });
    return utils.runRule(code, eslint, sourceCode);
  },
};
