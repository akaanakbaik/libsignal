'use strict';

const js = require('@eslint/js');
const globals = require('globals');

// Keep the existing rules while migrating to ESLint's flat configuration.
module.exports = [
    { ignores: ['node_modules/**', 'test/**', 'protos/**', '**/*.d.ts'] },
    {
        files: ['src/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: globals.node
        },
        linterOptions: { reportUnusedDisableDirectives: false },
        rules: {
            ...js.configs.recommended.rules,
            "quotes": ["warn", "single", {"avoidEscape": true}],
            "semi": ["error", "always"],
            "no-console": "error",
            "no-debugger": "error",
            "no-unused-vars": ["error", {"args": "none", "caughtErrors": "none"}],
            "no-constant-condition": ["error", {"checkLoops": false}],
            "no-trailing-spaces": "warn",
            "eol-last": ["error", "always"],
            "no-var": "warn",
            "prefer-const": "warn",
            "strict": ["warn", "global"],
            "no-prototype-builtins": "off",
        }
    }
];
