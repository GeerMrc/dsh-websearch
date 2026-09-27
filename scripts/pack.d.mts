/**
 * Type declarations for `scripts/pack.mjs` (dual-name tarball packer), so
 * `tests/pack.test.ts` can import the helpers under `moduleResolution:
 * nodenext` while the script itself stays plain ESM JavaScript.
 */

/** Strip an npm scope: `@scope/pkg` → `pkg`; bare input passes through. */
export declare function bareName(name: string): string

/**
 * Run `fn` with package.json's name field rewritten to `name`, restoring the
 * original bytes afterwards — including on failure.
 */
export declare function withFlippedName<T>(
  path: string,
  name: string,
  fn: () => Promise<T>,
): Promise<T>
