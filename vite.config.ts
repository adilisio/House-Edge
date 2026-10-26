import { resolve } from "node:path";
import { defineConfig } from "vite";

// Relative base so the build works from any static host or subfolder.
// One page per prototype scene.
export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        vault: resolve(import.meta.dirname, "index.html"),
        poker: resolve(import.meta.dirname, "poker.html"),
        cameras: resolve(import.meta.dirname, "cameras.html"),
      },
    },
  },
});
