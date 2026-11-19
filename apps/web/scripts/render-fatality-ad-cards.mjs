// Title cards for the vertical Fatality ad, rendered as transparent 1080 × 1920 PNGs.
// node apps/web/scripts/render-fatality-ad-cards.mjs <output-dir>
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const out = process.argv[2]
await mkdir(out, { recursive: true })

const SERIF = `'Bodoni 72', Didot, 'Times New Roman', serif`
const SANS = `'Avenir Next', 'Helvetica Neue', Arial, sans-serif`
const GOLD = '#d9b674'
const base = `
  * { box-sizing: border-box; margin: 0 }
  html, body { width: 1080px; height: 1920px; background: transparent; overflow: hidden; color: #fff }
  .wrap { position: absolute; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center; text-align: center; color: #fff }
  .serif { font-family: ${SERIF}; }
  .sans { font-family: ${SANS}; letter-spacing: .42em; text-transform: uppercase; font-weight: 600 }
  .shadow { text-shadow: 0 4px 30px rgba(0,0,0,.95), 0 0 2px #000 }
  .rule { width: 120px; height: 3px; background: ${GOLD}; margin: 28px auto }
  .top { position: absolute; left: 0; right: 0; top: 230px; text-align: center }
  .brand { position: absolute; left: 0; right: 0; top: 120px; text-align: center }
`
const cards = {
  'a1': `<div class="wrap"><div class="serif shadow" style="font-size:84px;font-style:italic">Sur le Black Whale,</div></div>`,
  'a2': `<div class="wrap"><div class="serif shadow" style="font-size:84px;font-style:italic;line-height:1.15">chaque duel<br>a une fin.</div></div>`,
  'brand': `<div class="brand"><div class="sans shadow" style="font-size:30px;letter-spacing:.5em">Black Whale <span style="color:${GOLD}">Clash</span></div></div>`,
  'b1': `<div class="top"><div class="rule"></div><div class="sans shadow" style="font-size:64px;line-height:1.3">40<br>combattants</div></div>`,
  'b2': `<div class="top"><div class="rule"></div><div class="sans shadow" style="font-size:58px;line-height:1.3">Un Nen<br>pour chacun</div></div>`,
  'slam': `<div class="wrap" style="background:#05070b">
      <div class="serif" style="font-size:190px;color:${GOLD};letter-spacing:.03em;
        text-shadow:0 0 60px rgba(217,130,60,.55)">FATALITY</div></div>`,
  'c1': `<div class="top"><div class="rule"></div><div class="sans shadow" style="font-size:56px;line-height:1.3">Chaque fin<br>est unique</div></div>`,
  'd1': `<div class="top"><div class="rule"></div><div class="sans shadow" style="font-size:66px;font-weight:700;line-height:1.25">Choisis ton<br>combattant</div></div>`,
  'end-bg': `<div class="wrap" style="background:radial-gradient(circle at 50% 42%, #172131, #05070b 70%)"></div>`,
  'end-logo': `<div class="wrap" style="padding-bottom:330px">
      <div class="sans" style="font-size:104px;letter-spacing:.24em;font-weight:700;line-height:1.15;margin-right:-.24em">Black<br>Whale</div>
      <div class="sans" style="font-size:60px;color:${GOLD};letter-spacing:.9em;margin-top:26px;margin-right:-.9em">Clash</div></div>`,
  'end-cta': `<div class="wrap" style="padding-top:330px">
      <div class="rule"></div>
      <div class="serif" style="font-size:76px;font-style:italic">Joue maintenant</div></div>`,
  'end-url': `<div class="wrap" style="padding-top:640px">
      <div class="sans" style="font-size:44px;letter-spacing:.06em;text-transform:none;color:${GOLD}">exploreblackwhale.com/fighting</div></div>`,
}

const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } })
for (const [name, body] of Object.entries(cards)) {
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${base}</style></head><body>${body}</body></html>`)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(out, `${name}.png`), omitBackground: true })
}
await browser.close()
process.stdout.write(`${Object.keys(cards).length} cards in ${out}\n`)
