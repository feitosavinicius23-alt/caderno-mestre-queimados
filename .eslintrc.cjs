module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react-hooks'],
  settings: { react: { version: '18.3' } },
  ignorePatterns: ['dist', 'dev-dist', 'node_modules', 'content', 'public', '*.cjs'],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  },
  overrides: [
    {
      files: ['scripts/**/*.mjs', 'lib/**/*.mjs', 'tests/**/*.mjs', 'vite.config.ts', 'vitest.config.ts'],
      rules: { 'no-console': 'off', '@typescript-eslint/no-unused-vars': 'off' },
    },
  ],
};
