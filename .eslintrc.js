module.exports = {
  parserOptions: {
    ecmaVersion: 2017
  },
  extends: ['eslint:recommended', 'prettier'],
  env: {
    node: true
  },
  overrides: [
    {
      files: ['**/*.test.js'],
      env: {
        jest: true
      }
    }
  ]
};
