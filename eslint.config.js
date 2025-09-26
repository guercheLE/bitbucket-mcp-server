const js = require('@eslint/js');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const eslintConfigPrettier = require('eslint-config-prettier');

const tsRecommended = /** @type {any[]} */ (tsPlugin.configs['flat/recommended'] || []);
const tsStylistic = /** @type {any[]} */ (tsPlugin.configs['flat/stylistic'] || []);

module.exports = [
    js.configs.recommended,
    ...tsRecommended,
    ...tsStylistic,
  /** @type {any} */ (eslintConfigPrettier),
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'off'
        }
    },
    {
        files: ['**/*.config.js', '**/*.config.cjs'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'commonjs',
            globals: {
                module: 'readonly',
                require: 'readonly',
                __dirname: 'readonly'
            }
        },
        rules: {
            '@typescript-eslint/no-require-imports': 'off'
        }
    },
    {
        files: ['tests/**/*.ts', 'tests/**/*.tsx', 'tests/**/*.js', 'tests/**/*.jsx'],
        languageOptions: {
            globals: {
                afterAll: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                beforeEach: 'readonly',
                describe: 'readonly',
                expect: 'readonly',
                it: 'readonly',
                jest: 'readonly'
            }
        }
    },
    {
        ignores: ['dist/**', 'node_modules/**', 'specs/**']
    }
];
