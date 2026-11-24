/**
 * Type declarations for `scripts/check-release.mjs` (release consistency
 * gate), so `tests/check-release.spec.ts` can import the helpers under
 * `moduleResolution: nodenext` while the script itself stays plain ESM
 * JavaScript.
 */

/** Files both distribution tarballs must carry. */
export declare const REQUIRED_ENTRIES: readonly string[]

/** Entries that never belong in a distribution tarball. */
export declare const FORBIDDEN_ENTRY: RegExp

/** Whether a tag names exactly the v-prefixed stable package version. */
export declare function tagMatchesVersion(tag: string, version: string): boolean

/** Whether the single user-agent constant carries the package version. */
export declare function userAgentMatchesVersion(source: string, version: string): boolean

/** Whether the changelog's first dated heading mentions `v<version>`. */
export declare function changelogHasVersion(changelog: string, version: string): boolean

/** The required tarball entries that are absent, in REQUIRED_ENTRIES order. */
export declare function missingRequiredEntries(entries: readonly string[]): string[]

/** The tarball entries that must not ship, in tarball order. */
export declare function forbiddenEntries(entries: readonly string[]): string[]

/** `{ path, count }` for every file in the `git grep -z -c HEAD` listing that carries a host token value. */
export declare function tokenFiles(text: string): { path: string; count: number }[]

/**
 * Run the requested check groups plus the token scan.
 * @param argv - The command-line arguments after the script name.
 * @param cwd - The repository root to check.
 * @returns The problems found, each one sentence naming the offending file, line or value.
 * @throws When no check group was requested, or when the token scan cannot run.
 */
export declare function main(argv: readonly string[], cwd?: string): Promise<string[]>
