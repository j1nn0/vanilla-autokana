import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [
    dts({
      outDir: "dist",
      tsconfigPath: "./tsconfig.build.json",
    }),
  ],
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      name: "AutoKana",
      fileName: (format) => `autokana.${format}.js`,
      formats: ["umd", "es"],
    },
  },
});
