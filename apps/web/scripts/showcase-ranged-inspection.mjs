import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

export async function inspectRangedDynamic(page, { report, output }) {
  if (!report.rangedDynamic) return
  const shots = report.closeups.shots
  const selected = [
    ['face-leorio', shots.find((s) => s.kind === 'face' && s.side === 'player'), 0.15],
    ['face-franklin', shots.find((s) => s.kind === 'face' && s.side === 'opponent'), 0.15],
    ['power-barrage', shots.find((s) => s.kind === 'barrage'), 0.4],
    ['power-hands', shots.find((s) => s.tip === 'fingers'), 0.08],
    ['power-remote', shots.filter((s) => s.kind === 'remote').at(-1), 0.17],
  ]
  for (const [name, shot, offset] of selected) {
    assert.ok(shot, `Missing ${name} shot`)
    await page.evaluate(
      (frame) => window.fightingShowcase.seek(frame),
      Math.round((shot.second + offset) * report.fps),
    )
    await page.clock.runFor(150)
    await page.screenshot({ path: path.join(output, `${name}.jpg`), type: 'jpeg', quality: 96 })
  }
  const fresh = await page.evaluate(() => window.fightingShowcase.report())
  const audit = fresh.catPresentation.ranged
  assert.ok(audit.faces.player > 0 && audit.faces.opponent > 0)
  assert.ok(audit.minimumFrontalAlignment > 0.95)
  assert.ok(audit.minimumFacePixels > 150)
  assert.ok(audit.punches > 0 && audit.barrages > 0)
  await writeFile(path.join(output, 'presentation-audit.json'), JSON.stringify(audit, null, 2))
}
