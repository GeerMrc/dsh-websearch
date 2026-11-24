/**
 * Type declarations for `scripts/pack.mjs` (dual-name tarball packer), so
 * `tests/pack.test.ts` can import the helpers under `moduleResolution:
 * nodenext` while the script itself stays plain ESM JavaScript.
 */

/** Strip an npm scope: `@scope/pkg` → `pkg`; bare input passes through. */
export declare function bareName(name: string): string

/**
 * Rewrite the insert-row loader-entry name between forms (scoped names are
 * YAML-quoted in the patch; bare names unquoted). Fails loud on a missing
 * anchor.
 */
export declare function flipPatchInsertName(text: string, from: string, to: string): string

/**
 * Rewrite the client bundle's registration id literal between forms. Fails
 * loud on a missing anchor.
 */
export declare function flipClientRegistrationId(text: string, from: string, to: string): string

/**
 * Run `fn` with package.json's name field rewritten to `name`, restoring the
 * original bytes afterwards — including on failure.
 */
export declare function withFlippedName<T>(
  path: string,
  name: string,
  fn: () => Promise<T>,
): Promise<T>

/**
 * Run `fn` with ALL THREE identity legs flipped to the bare name (manifest,
 * patch insert-row name, client registration id), restoring every file
 * afterwards — including on failure.
 */
export declare function withBareIdentity<T>(
  scoped: string,
  bare: string,
  fn: () => Promise<T>,
): Promise<T>
