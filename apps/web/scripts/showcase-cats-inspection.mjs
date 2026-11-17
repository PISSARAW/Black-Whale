import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'

export async function inspectCatsSpectacle(page, { report, output }) {
  const shots = report.spectacle.shots
  const targets = [
    ['apparition', shots[0].frame, 80],
    ['capture', shots[1].frame, 64],
    ['crush', shots[2].frame, 64],
    ['absorption', shots[2].frame, 128],
    ['resurrection', shots[3].frame, 136],
    ['victory', shots[4].frame, 30],
  ]
  const audits = []
  for (const [name, start, offset] of targets) {
    await page.evaluate((frame) => window.fightingShowcase.seek(frame), start)
    await page.clock.runFor(100)
    await page.evaluate((frame) => window.fightingShowcase.seek(frame), start + offset)
    await page.clock.runFor(100)
    await page.screenshot({
      path: path.join(output, `spectacle-${name}.jpg`),
      type: 'jpeg',
      quality: 94,
    })
    audits.push({
      name,
      ...(await page.evaluate(() => window.fightingShowcase.report().catPresentation)),
    })
  }
  await writeFile(path.join(output, 'presentation-audit.json'), JSON.stringify(audits, null, 2))
  for (const name of ['capture', 'crush', 'absorption'])
    assert.equal(
      audits.find((a) => a.name === name).grip.bothPawsTouching,
      true,
      `${name}: both paws must contact Chrollo`,
    )
  assert.equal(
    audits.find((a) => a.name === 'crush').grip.energyVisible,
    false,
    'Crush before absorption',
  )
  assert.ok(audits.find((a) => a.name === 'crush').grip.compression > 0.99)
  const face = audits.find((a) => a.name === 'victory').face
  if (face.bodyFrozen) {
    const closed = audits.find((a) => a.name === 'resurrection').face
    assert.deepEqual(face.headMatrix, closed.headMatrix, 'The body must remain fixed')
    assert.deepEqual(face.cameraPosition, closed.cameraPosition, 'No camera travel')
    assert.deepEqual(face.cameraRotation, closed.cameraRotation, 'No camera rotation')
  }
  assert.ok(
    face.alive &&
      face.frontalAlignment > 0.99 &&
      face.eyesOpen > 0.99 &&
      face.faceWidthPixels > 350 &&
      face.auraMultiplier <= 0.1 &&
      face.suppressedFaceAuraMeshes > 0,
  )
}
