#!/usr/bin/env node
/* build:harmony — one command from web sources to an (unsigned) HarmonyOS HAP.
 *
 * Chain: VITE_MOBILE=1 vite build → stage catalogue media → cap sync harmony
 *        → check-mobile-bundle → hvigor assembleHap (debug)
 *
 * Requirements (see docs/harmony.md):
 *   - DevEco Studio installed (DEVECO_HOME, default C:/Program Files/Huawei/DevEco Studio)
 *   - an ASCII-only project path (hvigor rejects non-ASCII cwd — keep a working
 *     copy on an ASCII path when the repo path itself contains non-ASCII)
 *
 * Usage: node scripts/build-harmony.mjs [frontend dir]     — default: cwd */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const front = resolve(process.argv[2] || process.cwd())
const repo = join(front, '..')
const stageMedia = join(repo, 'scripts/catalogue/stage-media.mjs')

const deveco = process.env.DEVECO_HOME || 'C:/Program Files/Huawei/DevEco Studio'
const hvigorwJs = join(deveco, 'tools/hvigor/bin/hvigorw.js')
const devecoNode = join(deveco, 'tools/node/node.exe')

const run = (label, cmd, args, opts = {}) => {
  process.stdout.write(`\n==> ${label}\n`)
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts })
  if (r.status !== 0) {
    console.error(`✗ step failed (${r.status}): ${label}`)
    process.exit(r.status ?? 1)
  }
}

// Web toolchain (vite 8 / rolldown) needs node >= 20.12 (styleText); the
// system node is used when present, falling back to whatever runs this file.
const webNode = process.execPath

// hvigor 6.x runs on node 18 (DevEco's bundled one) — newer node majors break it.
const hvigorNode = existsSync(devecoNode) ? devecoNode : webNode

const nodeIn = (cwd, env = {}, node = webNode) => (script, args = []) =>
  run(`${script} ${args.join(' ')}`, node, [script, ...args], {
    cwd,
    env: { ...process.env, ...env },
  })

// 1. mobile web build (the npm-script env prefix is shell-specific; pass it explicitly)
nodeIn(front, { VITE_MOBILE: '1' })('node_modules/vite/bin/vite.js', ['build'])

// 2. stage exercise media into dist/
nodeIn(front)(stageMedia, ['dist'])

// 3. sync web assets + regenerate PluginRegistry
nodeIn(front)('node_modules/@capacitor/cli/bin/capacitor', ['sync', 'harmony'])

// 4. guard: every native copy must be the mobile build
nodeIn(front)('scripts/check-mobile-bundle.mjs')

// 5. native build (hvigor runs on Node; the .bat wrapper is Windows-shell only)
run('hvigor assembleHap', hvigorNode, [
  hvigorwJs, '--mode', 'module', '-p', 'product=default', '-p', 'buildMode=debug',
  'assembleHap', '--no-daemon',
], {
  cwd: join(front, 'harmony'),
  env: { ...process.env, DEVECO_SDK_HOME: join(deveco, 'sdk') },
})

console.log('\n✓ HAP ready: harmony/entry/build/default/outputs/default/entry-default-unsigned.hap')
console.log('  (unsigned — see docs/harmony.md for signing before sideloading)')
