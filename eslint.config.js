import js from "@eslint/js";
import ts from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";
export default ts.config(
  {
    ignores: [
      "dist/**",
      "wordpress/releases/**",
      "node_modules/**",
      ".local-tools/**",
      ".pnpm-store/**",
      "wordpress/plugins/re-almeida-kits/assets/jsQR.js",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["wordpress/plugins/*/assets/*.js"],
    languageOptions: {
      globals: {
        document: "readonly",
        window: "readonly",
        crypto: "readonly",
        wp: "readonly",
      },
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "react-hooks": hooks },
    rules: { ...hooks.configs.recommended.rules },
  },
);
