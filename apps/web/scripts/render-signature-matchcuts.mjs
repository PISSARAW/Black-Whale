// Export every fighter's signature route through the existing production renderer.
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { readFile, rename } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import assert from 'node:assert/strict'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output =
  process.env.COMBO_EDIT_OUTPUT ?? path.join(root, 'output/fighting-signature-matchcuts')
const args = process.argv.slice(2)
const child = spawn(
  process.execPath,
  [
    path.join(root, 'apps/web/scripts/render-fighting-combo-edit.mjs'),
    '--demo=signature-matchcuts',
    ...args,
  ],
  { cwd: root, stdio: 'inherit', env: { ...process.env, COMBO_EDIT_OUTPUT: output } },
)
const [code] = await once(child, 'exit')
assert.equal(code, 0, 'Signature video rendering failed')
const report = JSON.parse(await readFile(path.join(output, 'edit-report.json'), 'utf8'))
assert.deepEqual(report.failures, [], 'A signature route failed')
if (!args.some((a) => a.startsWith('--only='))) assert.equal(report.clips.length, 40)
if (!args.some((a) => a === '--inspect' || a.startsWith('--stills='))) {
  const target = path.join(output, 'Black-Whale-Clash-Signature-Matchcuts.mp4')
  await rename(path.join(output, 'Black-Whale-Clash-40-Combos-Vertical.mp4'), target)
  process.stdout.write(`Export: ${target}\n`)
}
