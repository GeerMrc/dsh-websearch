import { defineConfig } from 'vitest/config'

/**
 * Minimal vitest config (S06): the published `dsh-client-ui-primitives` lib
 * imports its CSS modules at runtime, and externalized deps bypass vite's
 * transform (`Unknown file extension ".css"`). Inlining just that package
 * routes its CSS imports through vite, which stubs them for tests.
 */
export default defineConfig({
  test: {
    server: {
      deps: {
        inline: [/@deepseek-ai\/dsh-client-ui-primitives/],
      },
    },
  },
})
