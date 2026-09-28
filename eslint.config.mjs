import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Vendored registry components (shadcn, Magic UI, animate-ui) are kept as
    // published upstream; don't fork them just to satisfy React Compiler lints.
    files: ["src/components/ui/**", "src/components/animate-ui/**", "src/hooks/use-mobile.ts"],
    rules: { "react-hooks/set-state-in-effect": "off", "react-hooks/purity": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
