import { defineConfig } from 'tsdown'

/**
 * Client-half bundle: `src/client/index.ts` → `lib/client.js` (S06, ADR-0006
 * contract). The web shell serves each plugin exactly one prebuilt CommonJS
 * file whose text is a `window.__ModuleLoader__.load({ id, factory })` call —
 * banner/footer/intro below wrap the bundle body into that contract, the same
 * way the in-repo `clientBundle` preset does (host `tsdown.client.ts:589-591`).
 *
 * Externals are the frozen module table: react basics come from
 * `PLATFORM_MODULES`, and `@deepseek-ai/dsh-client-ui-primitives` is requested
 * through the manifest's `dsh.client.external` (package.json). Bundling any
 * `@deepseek-ai/*` implementation would fork React contexts and host styles —
 * the build must keep them external, which `pnpm build:client` evidence greps.
 */
export default defineConfig({
  entry: ['src/client/index.ts'],
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  target: 'es2024',
  dts: false,
  // Shares `lib/` with the node-half build: never clean the sibling outputs
  // (a failed run must not wipe `lib/index.js` either — observed live when the
  // entry did not exist yet).
  clean: false,
  external: [
    'react',
    'react/jsx-runtime',
    'react-dom',
    'react-dom/client',
    '@deepseek-ai/dsh-client-ui-primitives',
  ],
  outputOptions: {
    // Serving channel is single-file: `/plugins/<id>/` carries exactly client.js.
    entryFileNames: 'client.js',
    inlineDynamicImports: true,
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify('dsh-websearch')}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
})
