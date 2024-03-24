module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  quotes: 'single',
  rules: {
    'no-console': 2,
    'no-var': 2,
    'no-trailing-spaces': 2,
    'comma-dangle': ['error', 'always-multiline'],
    'max-len': ['error', { code: 130 }],
    'space-before-function-paren': 2,
    'padding-line-between-statements': [
      'error',
      {
        blankLine: 'always',
        prev: 'multiline-expression',
        next: 'multiline-expression',
      },
    ],
  },
  env: {
    node: true,
  },
};
