import { build } from 'vite'
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DIST = resolve(ROOT, 'dist')

async function buildExtension() {
  // 1. Build popup and options with Vite
  await build({})

  // 2. Copy manifest.json
  copyFileSync(resolve(ROOT, 'manifest.json'), resolve(DIST, 'manifest.json'))

  // 3. Build background script using esbuild (bundled with Vite)
  await buildScript('src/background/index.ts', 'background.js')
  await buildScript('src/content-script/index.ts', 'content.js')

  // 4. Create placeholder icons directory
  const iconsDir = resolve(DIST, 'icons')
  if (!existsSync(iconsDir)) {
    mkdirSync(iconsDir, { recursive: true })
    // Create minimal placeholder PNG files (1x1 pixel transparent PNG)
    for (const size of [16, 48, 128]) {
      createMinimalPNG(resolve(iconsDir, `icon-${size}.png`))
    }
  }

  console.log('✓ Extension built successfully')
}

async function buildScript(entry, outfile) {
  const { build: esbuild } = await import('esbuild')
  await esbuild({
    entryPoints: [resolve(ROOT, entry)],
    bundle: true,
    outfile: resolve(DIST, outfile),
    format: 'esm',
    target: 'es2020',
    platform: 'browser',
    external: [],
    minify: false,
  })
}

function createMinimalPNG(filepath) {
  // Minimal valid 1x1 transparent PNG
  const png = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02,
    0x00, 0x01, 0xE5, 0x27, 0xDE, 0xFC, 0x00, 0x00,
    0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42,
    0x60, 0x82,
  ])
  writeFileSync(filepath, png)
}

buildExtension().catch((err) => {
  console.error('Build failed:', err)
  process.exit(1)
})
