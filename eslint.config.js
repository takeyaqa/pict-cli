import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["bin/**/*.js"],
    plugins: { js },
    extends: ["js/recommended"],
  },
  {
    files: ["tests/**/*.spec.js"],
    plugins: { js },
    extends: ["js/recommended"],
  },
  eslintConfigPrettier,
]);
