module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    "ecmaVersion": 2020,
  },

  extends: [
    "eslint:recommended",
    "google",
  ],
  ignorePatterns: [".eslintrc.js"],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "object-curly-spacing": "off",
    "no-multiple-empty-lines": "warn",
    "padded-blocks": "warn",
    "no-unused-vars": "warn",
    "indent": "off",
    "quotes": ["error", "double", {"allowTemplateLiterals": true}],
    "max-len": ["error", {"code": 250}],
    "comma-dangle": "off",
    "brace-style": "off",
    "require-jsdoc": 0,
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
