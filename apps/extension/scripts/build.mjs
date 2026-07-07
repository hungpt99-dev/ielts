import { build } from 'vite'
import { copyFileSync, cpSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { argv } from 'process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DIST = resolve(ROOT, 'dist')
const isProduction = argv.includes('production')

async function buildExtension() {
  // 1. Build popup and options with Vite
  await build({})

  // 2. Copy manifest.json
  copyFileSync(resolve(ROOT, 'manifest.json'), resolve(DIST, 'manifest.json'))

  // 3. Build background and content scripts with esbuild
  const minify = isProduction
  await buildScript('src/background/index.ts', 'background.js', minify)
  await buildScript('src/content-script/index.ts', 'content.js', minify)

  // 4. Copy real icons from public/icons to dist/icons
  const sourceIcons = resolve(ROOT, 'public', 'icons')
  const destIcons = resolve(DIST, 'icons')
  if (existsSync(sourceIcons)) {
    cpSync(sourceIcons, destIcons, { recursive: true })
  }

  console.log(`✓ Extension built successfully${isProduction ? ' (production)' : ''}`)
}

async function buildScript(entry, outfile, minify) {
  const { build: esbuild } = await import('esbuild')
  await esbuild({
    entryPoints: [resolve(ROOT, entry)],
    bundle: true,
    outfile: resolve(DIST, outfile),
    format: 'esm',
    target: 'es2020',
    platform: 'browser',
    external: [],
    minify,
  })
}

buildExtension().catch((err) => {
  console.error('Build failed:', err)
  process.exit(1)
})
