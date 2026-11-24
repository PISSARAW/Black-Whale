import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const probeSelectionVoices = (page) =>
  page.addInitScript(() => {
    window.selectionVoices = []
    const bytesKeys = new WeakMap()
    const bufferKeys = new WeakMap()
    const read = Response.prototype.arrayBuffer
    Response.prototype.arrayBuffer = async function () {
      const bytes = await read.call(this)
      const key = this.url.match(/\/clash-voices\/(?:selection|rivals)\/([\w-]+)\.mp3$/)?.[1]
      if (key) bytesKeys.set(bytes, key)
      return bytes
    }
    const decode = AudioContext.prototype.decodeAudioData
    AudioContext.prototype.decodeAudioData = function (bytes) {
      const pending = decode.apply(this, arguments)
      const key = bytesKeys.get(bytes)
      if (key)
        void pending.then(
          (buffer) => {
            bufferKeys.set(buffer, key)
            window.selectionVoices.push(`decoded:${key}`)
          },
          () => {},
        )
      return pending
    }
    for (const event of ['start', 'stop']) {
      const method = AudioBufferSourceNode.prototype[event]
      AudioBufferSourceNode.prototype[event] = function () {
        const key = bufferKeys.get(this.buffer)
        if (key) window.selectionVoices.push(`${event}:${key}`)
        return method.apply(this, arguments)
      }
    }
  })

async function verifySelectionVoices(page) {
  const picker = (name) =>
    page.evaluate((mode) => window.rosterFixture.show(mode ?? 'academy'), name)
  const mute = (muted) => page.evaluate((value) => window.rosterFixture.mutePicker(value), muted)
  const events = () => page.evaluate(() => window.selectionVoices)
  const wait = (cue) => page.waitForFunction((key) => window.selectionVoices.includes(key), cue)
  const choose = (name) => page.locator('.character-grid').getByRole('button', { name }).click()
  await page.evaluate(() => window.rosterFixture.translate('fr'))
  await picker('selection')
  await page.getByRole('heading', { name: 'Choisis ton combattant.' }).waitFor()
  assert.deepEqual(await events(), [], 'the default fighter stays silent on entry')
  await choose(/^Kurapika,/)
  await wait('start:fr-hisoka--kurapika')
  assert.match(await page.locator('.selection-voice').innerText(), /Uvogin.*Neon/s)
  await page.getByRole('button', { name: 'Confirmer P1' }).click()
  await wait('stop:fr-hisoka--kurapika')
  await choose(/^Chrollo,/)
  await wait('start:fr-chrollo--kurapika')
  assert.deepEqual(await page.locator('.selection-voice strong').allTextContents(), [
    'Kurapika',
    'Chrollo',
  ])
  assert.match(await page.locator('.selection-voice q').first().innerText(), /Pakunoda/)
  await page.getByRole('button', { name: 'Choisir le terrain' }).click()
  await wait('stop:fr-chrollo--kurapika')

  await picker('selection')
  await page.evaluate(() => window.rosterFixture.translate('en'))
  await page.getByRole('button', { name: 'Play exchange' }).click()
  await wait('start:en-chrollo--kurapika')
  assert.match(
    await page.locator('.selection-voice q').first().innerText(),
    /Pakunoda kept her word/,
  )
  await choose(/^Bill,/)
  await wait('start:en-bill')
  assert.equal(await page.locator('.selection-voice q').count(), 1)

  let release
  const held = new Promise((resolve) => (release = resolve))
  await page.route('**/selection/en-benjamin.mp3', async (route) => {
    const response = await route.fetch()
    await held
    await route.fulfill({ response })
  })
  await choose(/^Benjamin,/)
  await choose(/^Hisoka,/)
  release()
  await wait('decoded:en-benjamin')
  await wait('start:en-chrollo--hisoka')
  assert.ok(!(await events()).includes('start:en-benjamin'), 'a late load is discarded')

  await mute(true)
  await wait('stop:en-chrollo--hisoka')
  await choose(/^Feitan,/)
  assert.ok(
    !(await events()).includes('start:en-chrollo--feitan'),
    'selecting while muted stays silent',
  )
  await mute(false)
  await picker('team')
  await page.getByRole('combobox', { name: 'P1 · Fighter 1' }).selectOption('theta')
  await wait('start:en-theta')
  await picker(null)
  await wait('stop:en-theta')
  process.stdout.write(
    'Character selection voices: P1/P2, replay, rapid selection, mute, teams and exit verified.\n',
  )
}

const root = fileURLToPath(new URL('../', import.meta.url))
const cacheDir = await mkdtemp(path.join(tmpdir(), 'black-whale-selection-'))
const server = await createServer({
  configFile: false,
  root,
  cacheDir,
  publicDir: 'static',
  plugins: [svelte({ configFile: false })],
  optimizeDeps: { entries: ['ui-tests/fighting-roster/index.html'], holdUntilCrawlEnd: false },
  resolve: {
    alias: {
      $lib: path.join(root, 'src/lib'),
      '$app/stores': path.join(root, 'ui-tests/fighting-roster/appStores.ts'),
    },
  },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
let browser
try {
  await server.listen()
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    headless: true,
  })
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } })
  page.setDefaultTimeout(12_000)
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await probeSelectionVoices(page)
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-roster/`,
    {
      waitUntil: 'commit',
    },
  )
  await page.waitForFunction(() => Boolean(window.rosterFixture), undefined, { timeout: 90_000 })
  await verifySelectionVoices(page)
  assert.deepEqual(errors, [])
} finally {
  await browser?.close()
  await server.close()
  await rm(cacheDir, { recursive: true, force: true })
}
