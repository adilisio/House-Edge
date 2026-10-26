import { resolve } from "node:path";
import { Compiler } from "inkjs/full";
import { defineConfig, type Plugin } from "vite";

/** Compiles .ink story files at build time, so the game ships only the runtime. */
function ink(): Plugin {
  return {
    name: "ink",
    transform(code, id) {
      if (!id.endsWith(".ink")) return null;
      const compiler = new Compiler(code);
      let json: string;
      try {
        json = compiler.Compile().ToJson() ?? "";
      } catch (e) {
        this.error([...(compiler.errors ?? []), String(e)].join("\n"));
      }
      if (compiler.errors.length) this.error(compiler.errors.join("\n"));
      return { code: `export default ${JSON.stringify(json)};`, map: null };
    },
  };
}

// Relative base so the build works from any static host or subfolder.
// One page per prototype scene, plus the act one story.
export default defineConfig({
  base: "./",
  plugins: [ink()],
  build: {
    rollupOptions: {
      input: {
        vault: resolve(import.meta.dirname, "index.html"),
        poker: resolve(import.meta.dirname, "poker.html"),
        cameras: resolve(import.meta.dirname, "cameras.html"),
        getaway: resolve(import.meta.dirname, "getaway.html"),
        act1: resolve(import.meta.dirname, "act1.html"),
        act2: resolve(import.meta.dirname, "act2.html"),
      },
    },
  },
});
