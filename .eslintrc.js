module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true,
    jest: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    project: './tsconfig.json',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'react-native'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-native/all',
    'prettier',
  ],
  rules: {
    // Typescript
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/ban-ts-comment': 'off',

    // React
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',

    // RN
    'react-native/no-inline-styles': 'off',
  },
  ignorePatterns: ['node_modules/', 'dist/', 'build/'],
};
