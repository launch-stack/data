import { defineConfig } from 'tsup';

export default defineConfig([
    // ESM Build Configuration
    {
        entry: ['src/index.ts'],
        format: ['esm'],
        dts: true,
        sourcemap: true,
        clean: true,
        outDir: 'dist',
    },
    // CJS Build Configuration
    {
        entry: ['src/index.ts'],
        format: ['cjs'],
        dts: false,
        sourcemap: true,
        clean: true,
        outDir: 'dist',
    },
]);
