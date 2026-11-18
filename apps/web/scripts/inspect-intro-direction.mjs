import assert from 'node:assert/strict'
import path from 'node:path'
import { writeFile } from 'node:fs/promises'

export async function inspectIntroDirection(page, output) {
  const origin = new URL(page.url()).origin
  await page.goto(`${origin}/ui-tests/fighting-introduction/direction.html`)
  await page.waitForFunction(() => Boolean(window.introDirectionFixture?.snapshot().ready))
  const results = []
  for (const id of ['hisoka', 'benjamin', 'feitan', 'biscuit', 'bonolenov', 'illumi']) {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.evaluate(
      (id) => window.introDirectionFixture.select({ id, side: 'player', progress: 0.2 }),
      id,
    )
    await page.waitForFunction(() => window.introDirectionFixture.snapshot().ready)
    await settle(page)
    const from = await page.evaluate(() => window.introDirectionFixture.snapshot())
    await page.screenshot({ path: path.join(output, `${id}-anticipation.png`) })
    await page.evaluate(() => window.introDirectionFixture.seek(0.6))
    await settle(page)
    const signature = await page.evaluate(() => window.introDirectionFixture.snapshot())
    assert.equal(signature.audit.finite, true)
    assert.notDeepEqual(from.audit.camera, signature.audit.camera)
    assert.notDeepEqual(from.audit.arms, signature.audit.arms)
    await page.screenshot({ path: path.join(output, `${id}-signature.png`) })
    results.push({ id, from: from.audit, signature: signature.audit })
  }
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 720 })
    await page.evaluate(() =>
      window.introDirectionFixture.select({ id: 'benjamin', side: 'opponent', progress: 0.5 }),
    )
    await page.waitForFunction(() => window.introDirectionFixture.snapshot().ready)
    await settle(page)
    assert.equal(
      await page.evaluate(() => window.introDirectionFixture.snapshot().audit.finite),
      true,
    )
    await page.screenshot({ path: path.join(output, `direction-p2-${width}.png`) })
  }
  await writeFile(path.join(output, 'direction.json'), JSON.stringify(results, null, 2))
}

async function settle(page) {
  await page.waitForTimeout(180)
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  )
}
