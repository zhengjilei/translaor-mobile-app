module.exports = {
  extends: 'expo',
  env: {
    browser: true, // Provides setTimeout, clearTimeout, etc. in React Native context
  },
  rules: {
    // Catch common bugs
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-console': 'warn', // Prefer the logger utility over raw console calls
  },
  ignorePatterns: ['node_modules/', '.expo/'],
};
