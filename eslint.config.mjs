import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import studio from "@sanity/eslint-config-studio";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...studio,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".sanity/**",
    "dist/**",
  ]),
]);

export default eslintConfig;
