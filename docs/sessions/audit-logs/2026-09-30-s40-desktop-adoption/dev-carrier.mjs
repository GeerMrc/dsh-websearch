// Dev-form desktop carrier: invoke the built desktop-host CLI entry with correct
// runtime/support directories (its self-locating default assumes the packaged layout).
const { runDesktopCli } = await import(
  'file:///Volumes/IPFSJK/Zcode/deepseek-harness/apps/desktop/.desktop-build/development/project/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js'
)
const base = '/Volumes/IPFSJK/Zcode/deepseek-harness/apps/desktop/.desktop-build'
await runDesktopCli(`${base}/development/project`, `${base}/targets/mac-arm64/runtime/primary-runtime/dependencies`)
