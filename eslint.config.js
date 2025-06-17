export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module"
    },
    linterOptions: {
      reportUnusedDisableDirectives: true
    },
    plugins: {
    },
    rules: {
      "no-unused-vars": ["warn", { "args": "none", "ignoreRestSiblings": true }],
      "no-console": "off",
      "prefer-const": "warn",
      "eqeqeq": ["error", "always"],
      "curly": ["warn", "all"],
      "semi": ["error", "always"]
    }
  }
]; 