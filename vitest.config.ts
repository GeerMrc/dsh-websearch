import { defineConfig } from 'vitest/config'

/**
 * Minimal vitest config (S06): the published `dsh-client-ui-primitives` lib
 * imports its CSS modules at runtime, and externalized deps bypass vite's
 * transform (`Unknown file extension ".css"`). Inlining just that package
 * routes its CSS imports through vite, which stubs them for tests. The setup
 * file polyfills `ResizeObserver` for jsdom (S32: the 0.1.7 Tooltip measures
 * itself through it; jsdom has no layout).
 */
export default defineConfig({
  test: {
    setupFiles: ['tests/client/resize-observer-polyfill.ts'],
    server: {
      deps: {
        inline: [/@deepseek-ai\/dsh-client-ui-primitives/],
      },
    },
  },
})
