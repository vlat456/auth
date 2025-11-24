// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'], // Specify your tsconfig.json path
      },
    },
    rules: {
      // Code smell detection rules
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-use-before-define": "error",
      "prefer-const": "error", 
      "no-var": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/promise-function-async": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/restrict-template-expressions": "warn",
      "@typescript-eslint/no-unnecessary-type-assertion": "warn",
      "no-console": "warn",
      "no-duplicate-imports": "error",
      "no-implicit-globals": "error",
      "no-multi-spaces": "error",
      "no-multiple-empty-lines": ["error", { "max": 1 }],
      "no-trailing-spaces": "error",
      "eol-last": ["error", "always"],
      "comma-dangle": ["error", "always-multiline"]
    }
  }
);