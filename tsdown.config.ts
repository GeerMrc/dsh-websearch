import { defineConfig } from 'tsdown'

/**
 * Node-half bundle: `src/index.ts` → `lib/index.js` (ESM) + `lib/index.d.ts`.
 * The client half builds through `tsdown.client.config.ts` (`pnpm build:client`).
 */
export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: 'esm',
  platform: 'node',
  dts: true,
  // Pin `.js`/`.d.ts`: package.json `exports` points at these names (tsdown's
  // default for `type: module` is `.mjs`/`.d.mts`).
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
})
