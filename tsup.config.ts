import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/cli/index.ts'],
  outDir: 'dist',
  outExtension: () => ({ js: '.js' }),
  banner: { js: '#!/usr/bin/env node' },
  format: ['cjs'],
  platform: 'node',
  bundle: true,
  minify: false,
  sourcemap: true,
  clean: true,
  dts: false,
  // Bundle everything except native modules and optional peer deps
  external: [
    // These may have native bindings
    'fsevents',
    'bcrypt',
    'sharp',
  ],
  treeshake: true,
  esbuildOptions(options) {
    options.alias = {
      // Ensure consistent module resolution
    }
  },
})
