module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/essential',
    'eslint:recommended'
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    // Backend config.controller values are used as component names/basenames,
    // so single-word and HTML-reserved names (Map, Form) are intentional.
    'vue/multi-word-component-names': 'off',
    'vue/no-reserved-component-names': 'off',
    // Vue 2 / Element UI header slots must stay scoped for inputs inside them
    // to remain reactive. Convention: prefix intentionally unused bindings with _.
    'vue/no-unused-vars': ['error', { ignorePattern: '^_' }],
    // Vue 2 codebase mutates props directly in many editors; surface as warnings
    // so new instances are visible without breaking lint on existing code.
    'vue/no-mutating-props': 'warn'
  },
  parserOptions: {
    parser: '@babel/eslint-parser',
    requireConfigFile: false,
    babelOptions: {
      configFile: false
    }
  }
}
