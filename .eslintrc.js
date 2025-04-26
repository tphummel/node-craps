module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'prettier'],
    extends: [
      'standard',
      'plugin:@typescript-eslint/recommended',
      'plugin:prettier/recommended'
    ],
    rules: {
      'prettier/prettier': 'error'
    }
  }