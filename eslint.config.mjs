import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import filenames from 'eslint-plugin-filenames';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: false,
        },
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      prettier,
      filenames,
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',

      '@typescript-eslint/no-var-requires': 'error',

      // General rules
      'no-unused-vars': 'off', // Disable base rule as it can report incorrect errors
      'no-console': 'off', // Allow console for CLI tools
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-expressions': 'error',
      'prefer-const': 'error',
      'no-var': 'error',

      // File naming rules
      'filenames/match-exported': 'off',

      // Prettier integration
      'prettier/prettier': 'error',
    },
  },
  // Configuração específica para arquivos de tools MCP
  {
    files: ['**/tools/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Desabilita avisos sobre 'any' nos tools MCP
    },
  },
  // Configuração específica para validações de escopo
  {
    files: ['**/utils/scope-validator.util.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Desabilita avisos sobre 'any' nas validações de escopo
    },
  },
  {
    ignores: ['dist/', 'build/', 'node_modules/', 'coverage/', '*.config.js', '*.config.mjs'],
  },
];
