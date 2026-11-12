import { defineConfig } from "tsup";

// Bundles the API into dist/ for production.
// @devpulse/shared is bundled in, because it ships TypeScript source, not built JS.
export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  platform: "node",
  target: "node24",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  noExternal: ["@devpulse/shared"],
});
