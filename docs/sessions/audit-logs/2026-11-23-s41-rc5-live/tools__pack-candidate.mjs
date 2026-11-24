// Pack the bare-name candidate tarball into a scratch directory without touching dist-artifacts/.
// Usage: pack-candidate.mjs <repoRoot> <destination>
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
const [repoRoot, destination] = process.argv.slice(2)
const { withFlippedName, bareName } = await import(pathToFileURL(join(repoRoot, 'scripts', 'pack.mjs')).href)
const pkgPath = join(repoRoot, 'package.json')
const pkg = JSON.parse(await (await import('node:fs/promises')).readFile(pkgPath, 'utf8'))
const file = await withFlippedName(pkgPath, bareName(pkg.name), () => {
  const result = spawnSync('npm', ['pack', '--json', '--pack-destination', destination], { cwd: repoRoot, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`npm pack exited ${result.status}: ${result.stderr}`)
  return JSON.parse(result.stdout)[0].filename
})
console.log(file)
