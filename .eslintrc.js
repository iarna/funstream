module.exports = {
  parserOptions: {
    ecmaVersion: 8,
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
      impliedStrict: true
    }
  },

  env: {
    es6: true,
    node: true
  },

  globals: {
    document: false,
    navigator: false,
    window: false
  },
  plugins: [
    "node",
    "promise",
    "security",
    "dependencies",
    "unicorn"
  ],
  extends: [
    "plugin:security/recommended",
    "standard"
  ],
  rules: {
    // enable some things standard doesn't
    "no-prototype-builtins": "error",
    "array-callback-return": "error",
    "no-implicit-coercion": "error",

    // disable some standard things
    "indent": 0, // I'd love to have this rule, but it's wrong about
                 // expressions in ways I can't seem to disable
    "no-return-assign": 0,

    "security/detect-object-injection": 0,
    "dependencies/case-sensitive": 1,
    "dependencies/no-unresolved": 1,
    "dependencies/require-json-ext": 1,
    "unicorn/catch-error-name": ["error", {"name": "err"}],
    "unicorn/explicit-length-check": "error",
    "unicorn/filename-case": ["error", {"case": "kebabCase"}],
    "unicorn/no-abusive-eslint-disable": "error",
    "unicorn/no-process-exit": "error",
    "unicorn/throw-new-error": "error",
    "unicorn/number-literal-case": "error",
    "unicorn/escape-case": "error",
    "unicorn/no-array-instanceof": "error",
    "unicorn/no-new-buffer": "error",
    "unicorn/no-hex-escape": "error",
    "unicorn/custom-error-definition": "error",
    "unicorn/prefer-starts-ends-with": "error",
    "unicorn/prefer-type-error": "error",
    "unicorn/regex-shorthand": "error",
  }
}