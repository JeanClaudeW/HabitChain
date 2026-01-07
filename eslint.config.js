import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', '.expo/**', '.eslintrc.js'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooks,
      'react-native': reactNative,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/ban-ts-comment': 'off',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-native/no-inline-styles': 'off',
    },
    settings: { react: { version: 'detect' } },
  },
];
