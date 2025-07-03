import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      // Ignore generated Prisma files
      "src/generated/**/*",
      // Ignore build outputs
      ".next/**/*",
      "dist/**/*",
      // Ignore node_modules
      "node_modules/**/*",
    ],
  },
];

export default eslintConfig;
