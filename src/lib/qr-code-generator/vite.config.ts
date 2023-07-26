/// <reference types="vitest" />
import { defineConfig } from 'vite';

import viteTsConfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';
import * as path from 'path';

export default defineConfig({
  cacheDir: '../../../node_modules/.vite/qr-code-generator',

  plugins: [
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(__dirname, 'tsconfig.lib.json'),
    }),

    viteTsConfigPaths({
      root: '../../../',
    }),
  ],
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: 'index.ts',
      name: 'qr-code-generator',
      fileName: 'index',
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: [],
    },
  },

  test: {
    globals: true,
    cache: {
      dir: '../../../node_modules/.vitest',
    },
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
});
