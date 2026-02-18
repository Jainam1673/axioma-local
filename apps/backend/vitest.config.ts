import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
      include: ["src/modules/engine/**/*.ts", "src/modules/auth/**/*.ts"],
      exclude: ["**/*.module.ts", "**/*.controller.ts", "**/*.dto.ts", "**/*.types.ts"],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },
    },
  },
});
