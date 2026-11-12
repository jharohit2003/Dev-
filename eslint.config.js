import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Never lint generated output.
  { ignores: ["**/dist/**", "**/coverage/**", "**/node_modules/**"] },

  // Rules for every file.
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Allow unused variables only when they start with _ (like _req, _next).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Forces `import type` for types, which keeps runtime bundles clean.
      "@typescript-eslint/consistent-type-imports": "error",
      eqeqeq: ["error", "always"],
    },
  },

  // Backend and config files run in Node.
  {
    files: ["apps/api/**/*.ts", "packages/**/*.ts", "*.config.{js,ts}", "**/*.config.ts"],
    languageOptions: { globals: globals.node },
    rules: {
      // Use the logger, not console, so logs stay structured.
      "no-console": "error",
    },
  },

  // Frontend runs in the browser and uses React.
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.flat.recommended.rules,
  },
  {
    files: ["apps/web/src/**/*.tsx"],
    ...reactRefresh.configs.vite,
  },

  // Turns off style rules that Prettier handles. Must be last.
  prettier,
);
