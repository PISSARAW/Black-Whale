import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.MANGA_CAST_OUTPUT ?? '/tmp/black-whale-manga-cast'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  logLevel: 'error',
})
await server.listen()
let browser
const errors = []
const checks = []
try {
  browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1150 } })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/manga-cast/`)
  await page.waitForFunction(() => window.mangaCastFixture, undefined, { timeout: 120000 })
  const ids =
    process.env.MANGA_CAST_IDS?.split(',') ??
    (await page.evaluate(() => window.mangaCastFixture.ids))
  for (let i = 0; i < ids.length; i += 4) {
    const batch = ids.slice(i, i + 4)
    await page.evaluate((ids) => window.mangaCastFixture.setCharacters(ids), batch)
    const stats = await page.evaluate(() =>
      window.mangaCastFixture.models.map(({ human, id, row }) => {
        let meshes = 0
        human.root.traverse((node) => {
          if (node.isMesh) meshes++
        })
        return { id, row, meshes }
      }),
    )
    assert.equal(stats.length, batch.length * 2)
    for (const stat of stats)
      assert.ok(stat.meshes > 10 && stat.meshes < 300, `${stat.id}: ${stat.meshes} meshes`)
    const views = process.env.MANGA_CAST_VIEWS?.split(',') ?? ['body', 'face', 'profile', 'combat']
    for (const view of views) {
      await page.evaluate((view) => window.mangaCastFixture.show(view), view)
      await page.screenshot({
        path: path.join(output, `${String(i / 4 + 1).padStart(2, '0')}-${view}.png`),
      })
    }
    checks.push(...stats)
    process.stdout.write(`${Math.min(i + 4, ids.length)}/${ids.length}: ${batch.join(', ')}\n`)
  }
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ passed: true, characters: ids.length, checks, errors }, null, 2),
  )
} finally {
  await browser?.close()
  await server.close()
}
