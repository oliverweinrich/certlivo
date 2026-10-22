// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// ESLint requires its configuration as a default export; application code does not.
export default tseslint.config(
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    files: [
      'src/**/*.ts',
      'scripts/**/*.ts',
      'release/**/*.ts',
      'tests/**/*.ts',
      '.github/**/*.ts',
    ],
    languageOptions: {
      parserOptions: {
        project: ['tsconfig.json', 'tsconfig.tools.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
      'no-console': 'error',
      'max-lines': ['error', { max: 200, skipBlankLines: true }],
      complexity: ['error', 20],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ClassDeclaration',
          message: 'Use functional composition.',
        },
        { selector: 'ClassExpression', message: 'Use functional composition.' },
        { selector: 'ThisExpression', message: 'Do not use this.' },
        {
          selector: 'SwitchStatement',
          message: 'Use explicit guards or typed lookup tables.',
        },
        { selector: 'ExportDefaultDeclaration', message: 'Use named exports.' },
      ],
    },
  },
);
