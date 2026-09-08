import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import globals from 'globals';

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', 'tmp/**']
  },
  js.configs.recommended,
  ...vue.configs['flat/essential'],
  {
    files: ['frontend/src/**/*.{js,vue}', 'frontend/vite.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'vue/multi-word-component-names': 'off'
    }
  },
  {
    files: ['backend/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.es2021, fetch: 'readonly', FormData: 'readonly' }
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-undef': 'error'
    }
  },
  {
    files: ['backend/scripts/e2e-smoke.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser }
    }
  }
];
