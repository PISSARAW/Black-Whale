import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url)),
  output = process.env.CAREER_CHECK_OUTPUT ?? '/tmp/black-whale-career-ui'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [
    svelte({ configFile: false }),
    {
      name: 'career-check-api',
      configureServer(vite) {
        vite.middlewares.use(serve)
      },
    },
  ],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  optimizeDeps: { entries: ['ui-tests/fighting-career/index.html'], holdUntilCrawlEnd: false },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
const { clashSeasons } = await server.ssrLoadModule('/src/lib/server/clashSeasons.ts')
const { clashPvpRegistry } = await server.ssrLoadModule('/src/lib/server/clashPvp.ts')
const { createFightEnvironment } = await server.ssrLoadModule(
  '/src/lib/fighting/fightEnvironment.ts',
)
async function serve(req, res, next) {
  if (!req.url?.startsWith('/__')) return next()
  let body = ''
  for await (const chunk of req) body += chunk.toString()
  let result
  if (req.url === '/__career')
    result =
      req.method === 'POST'
        ? clashSeasons.register(JSON.parse(body).name)
        : clashSeasons.leaderboard()
  else if (req.url === '/__watch') {
    const session = clashPvpRegistry.create({
      player: 'hisoka',
      opponent: 'chrollo',
      formatId: 'knockout',
      environment: createFightEnvironment(),
    })
    result = { token: session.watchHref.split('#')[1], endpoint: `/__watch/${session.matchId}` }
  } else {
    const token = req.headers.authorization?.slice(7) ?? ''
    result = clashPvpRegistry.watch(req.url.split('/')[2], token)
  }
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(result))
}
await server.listen()
const browser = await chromium.launch({
  headless: true,
  args:
    process.env.CAREER_CHECK_WEBGL === '1'
      ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
      : ['--disable-3d-apis'],
})
const errors = []
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
    reducedMotion: 'reduce',
  })
  page.setDefaultTimeout(45000)
  page.on('pageerror', (error) => {
    errors.push(error.message)
    process.stderr.write(error.stack + '\n')
  })
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-career/`,
    { waitUntil: 'domcontentloaded' },
  )
  await page.waitForFunction(() => Boolean(window.careerFixture), null, { timeout: 30000 })
  const hash = await page.evaluate(() => window.careerFixture.hash())
  await page.getByLabel('Pseudo local', { exact: true }).fill('Nen Hunter')
  await page.getByLabel('Habillage', { exact: true }).selectOption('nocturne')
  await page.getByLabel('Pose de victoire', { exact: true }).selectOption('ready')
  await page.getByRole('button', { name: 'Enregistrer le profil', exact: true }).click()
  assert.equal(await page.evaluate(() => window.careerFixture.hash()), hash)
  assert.equal(await page.locator('.ceremony').getAttribute('data-theme'), 'nocturne')
  await page.getByRole('button', { name: 'Terminer un duel', exact: true }).click()
  await page
    .locator('.career-grid')
    .getByText(/1\s+match/)
    .waitFor()
  await page.getByLabel('Pseudo de saison', { exact: true }).fill('Nen Hunter')
  await page.getByRole('button', { name: 'Inscrire mon profil PvP', exact: true }).click()
  await page.getByText('Profil inscrit : Nen Hunter', { exact: false }).waitFor()
  await page
    .getByLabel('Participants · un nom par ligne', { exact: true })
    .fill('Kurapika\nHisoka\nChrollo')
  await page.getByRole('button', { name: 'Créer le tableau', exact: true }).click()
  for (let index = 0; index < 2; index++)
    await page.locator('.tournament-panel article button').first().click()
  await page
    .locator('.tournament-panel [role=status]')
    .getByText('Champion : Kurapika', { exact: false })
    .waitFor()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page
    .locator('.career-grid')
    .getByText(/1\s+match/)
    .waitFor()
  assert.equal(await page.getByLabel('Pseudo local', { exact: true }).inputValue(), 'Nen Hunter')
  await page
    .locator('.tournament-panel [role=status]')
    .getByText('Champion : Kurapika', { exact: false })
    .waitFor()
  await page.getByRole('button', { name: 'Ouvrir le spectateur', exact: true }).click()
  await page.getByRole('status').filter({ hasText: 'Spectateur · lecture seule' }).waitFor()
  assert.equal(
    await page.getByRole('region', { name: 'Vue spectateur' }).getByRole('button').count(),
    0,
  )
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1050 })
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    )
    await page.screenshot({ path: path.join(output, `career-${width}.png`), fullPage: true })
  }
  await page.evaluate(() => window.careerFixture.english())
  await page.getByRole('heading', { name: 'My profile', exact: true }).waitFor()
  assert.deepEqual(errors, [])
  process.stdout.write(`Career, season, tournament and spectator UI passed; ${output}\n`)
} finally {
  await browser.close()
  await server.close()
}
