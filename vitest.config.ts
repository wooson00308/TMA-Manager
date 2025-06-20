import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: [
      "server/**/*.spec.ts",
      "server/**/*.test.ts",
      "**/*.spec.ts",
      "**/*.test.ts",
    ],
    environment: "node",
    coverage: {
      provider: "v8",
      all: true,
      include: ["server/**/*.ts"],
      exclude: ["**/*.spec.ts", "**/*.test.ts", "node_modules/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@shared/domain": path.resolve(__dirname, "shared", "domain"),
      "@shared/ai": path.resolve(__dirname, "shared", "ai"),
      "@domain": path.resolve(__dirname, "shared", "domain"),
    },
  },
}); 