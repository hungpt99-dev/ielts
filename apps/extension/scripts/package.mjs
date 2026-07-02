import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DIST = resolve(ROOT, 'dist')

async function packageExtension() {
  const manifest = JSON.parse(readFileSync(resolve(DIST, 'manifest.json'), 'utf-8'))
  const version = manifest.version
  const name = manifest.name.replace(/\s+/g, '-').toLowerCase()
  const zipName = `${name}-v${version}.zip`
  const zipPath = resolve(ROOT, zipName)

  console.log(`Packaging extension v${version}...`)

  execSync(`cd "${DIST}" && zip -r "${zipPath}" .`, { stdio: 'inherit' })

  const stats = execSync(`ls -lh "${zipPath}"`).toString().trim()
  console.log(`\n✓ Extension packaged:`)
  console.log(`  ${stats}`)
  console.log(`\nReady for Chrome Web Store upload.`)
  console.log(`  File: ${zipName}`)
}

packageExtension().catch((err) => {
  console.error('Packaging failed:', err)
  process.exit(1)
})
