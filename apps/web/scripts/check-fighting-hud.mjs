import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.HUD_CHECK_OUTPUT ?? '/tmp/black-whale-hud-roster'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  optimizeDeps: { entries: ['ui-tests/fighting-hud/index.html'] },
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port: 0 },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  headless: true,
})
const failures = []
let cases = 0
try {
  const page = await browser.newPage()
  page.on('pageerror', (error) => failures.push({ type: 'javascript', message: error.message }))
  const url = `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-hud/`
  await page.goto(url)
  await page.waitForFunction(() => window.hudFixture)
  await page.evaluate(() => document.fonts.ready)
  const roster = await page.evaluate(() => window.hudFixture.roster())
  for (const width of [1440, 844, 640, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    const options = roster.flatMap((id) =>
      [false, true].flatMap((detailed) =>
        ['fr', 'en'].map((language) => ({
          player: id,
          opponent: id,
          detailed,
          training: detailed,
          language,
        })),
      ),
    )
    for (const player of ['chrollo', 'kurapika', 'benjamin']) {
      for (const opponent of ['chrollo', 'kurapika', 'benjamin']) {
        for (const detailed of [false, true]) {
          for (const language of ['fr', 'en']) {
            options.push({ player, opponent, detailed, language, loaded: true, training: detailed })
          }
        }
      }
      options.push({ player, opponent: player, loaded: true, suspended: true })
    }
    for (const state of options) {
      await page.evaluate((state) => window.hudFixture.renderCase(state), state)
      const problems = await page.evaluate(() => {
        const issues = []
        const overlap = (a, b) =>
          Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
          Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
        if (document.documentElement.scrollWidth > innerWidth + 1)
          issues.push('horizontal page overflow')
        const root = document.querySelector('.fixture')
        for (const element of root.querySelectorAll('*')) {
          if (
            element.clientWidth &&
            element.scrollWidth > element.clientWidth + 2 &&
            getComputedStyle(element).overflowX === 'visible'
          ) {
            issues.push(`overflow: ${element.className || element.tagName}`)
          }
        }
        const hud = root.querySelector('.hud').getBoundingClientRect()
        const training = root.querySelector('.training-frame-data')
        if (training && overlap(hud, training.getBoundingClientRect()))
          issues.push('training data overlaps HUD')
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
        const text = []
        while (walker.nextNode()) {
          const node = walker.currentNode
          if (!node.textContent.trim()) continue
          const range = document.createRange()
          range.selectNodeContents(node)
          for (const rect of range.getClientRects()) {
            const visible = {
              left: rect.left,
              right: rect.right,
              top: rect.top,
              bottom: rect.bottom,
            }
            for (
              let parent = node.parentElement;
              parent && parent !== root;
              parent = parent.parentElement
            ) {
              const style = getComputedStyle(parent)
              const bounds = parent.getBoundingClientRect()
              if (style.overflowX !== 'visible') {
                visible.left = Math.max(visible.left, bounds.left)
                visible.right = Math.min(visible.right, bounds.right)
              }
              if (style.overflowY !== 'visible') {
                visible.top = Math.max(visible.top, bounds.top)
                visible.bottom = Math.min(visible.bottom, bounds.bottom)
              }
            }
            if (visible.right - visible.left > 1 && visible.bottom - visible.top > 1)
              text.push({ rect: visible, value: node.textContent.trim().slice(0, 50) })
          }
        }
        for (let i = 0; i < text.length; i++) {
          for (let j = i + 1; j < text.length; j++) {
            if (overlap(text[i].rect, text[j].rect))
              issues.push(`text overlap: ${text[i].value} / ${text[j].value}`)
          }
        }
        return [...new Set(issues)]
      })
      // Verify gameplay warnings are still real visible text in compact mode.
      const resources = await page.locator('.combat-resources').innerText()
      if (state.loaded && !state.suspended) {
        if ([state.player, state.opponent].includes('kurapika')) {
          assert.match(resources, /Emperor Time/)
          assert.match(resources, /Stealth Dolphin/)
          assert.match(resources, /RESTE EN ZETSU|REMAIN IN ZETSU/)
          assert.match(resources, /mort|death/)
        }
        if ([state.player, state.opponent].includes('chrollo')) {
          assert.match(resources, /Double Face/)
          assert.match(resources, /Black Voice/)
          assert.match(resources, /Cible marquée|Marked target/)
        }
        if ([state.player, state.opponent].includes('benjamin')) {
          assert.match(resources, /carte prête|card ready/)
          assert.match(resources, /Secret Window/)
        }
      }
      cases++
      if (problems.length) failures.push({ width, ...state, problems })
      if (
        state.player === state.opponent &&
        ['chrollo', 'kurapika', 'benjamin'].includes(state.player) &&
        state.loaded &&
        state.detailed &&
        state.language === 'fr'
      ) {
        await page.screenshot({
          path: path.join(output, `${state.player}-${width}.png`),
          fullPage: true,
        })
      }
    }
    process.stdout.write(`${width}px: ${options.length} HUD cases checked\n`)
  }
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ characters: roster.length, cases, failures }, null, 2),
  )
  process.stdout.write(
    `${JSON.stringify({ characters: roster.length, cases, failures: failures.length, output })}\n`,
  )
  assert.equal(failures.length, 0, `HUD regressions: see ${path.join(output, 'report.json')}`)
} finally {
  await browser.close()
  await server.close()
}
