import path from 'node:path'
import { readFile } from 'node:fs/promises'

const styles = `body{margin:0;padding:24px;background:#101820;color:#edf0e8;font:16px system-ui}h1{font-size:23px;margin:0 0 8px}p{color:#b5c5cb}main{display:grid;grid-template-columns:1fr 1fr;gap:20px}section{background:#18242d;padding:12px;border-radius:8px}h2{margin:0 0 8px}section>div{display:flex;gap:12px}figure{margin:0;flex:1;text-align:center}img{width:150px;height:140px;object-fit:contain}figcaption{font-size:14px;color:#cad8dc}.direction{font-size:12px;min-height:34px;margin:4px 0}`
const escape = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

export async function renderExpressionGallery({ page, output, fighters }) {
  await page.goto('about:blank')
  const cards = new Map()
  for (const fighter of fighters) {
    const images = []
    for (const situation of ['concentration', 'effort', 'pain']) {
      const data = await readFile(path.join(output, `${fighter.id}-${situation}-face.png`))
      images.push(
        `<figure><img src="data:image/png;base64,${data.toString('base64')}"><figcaption>${situation === 'pain' ? 'douleur' : situation}</figcaption></figure>`,
      )
    }
    cards.set(
      fighter.id,
      `<section><h2>${escape(fighter.name)}</h2><p class="direction">${escape(fighter.direction)}</p><div>${images.join('')}</div></section>`,
    )
  }
  async function sheet(ids, name) {
    await page.setContent(
      `<html lang="fr"><head><style>${styles}</style></head><body><h1>Clash · émotions pendant le combat</h1><p>Recadrages de la caméra de combat · concentration, effort, douleur</p><main>${ids.map((id) => cards.get(id)).join('')}</main></body></html>`,
    )
    await page.screenshot({ path: path.join(output, name), fullPage: true })
  }
  for (let index = 0; index < fighters.length; index += 8)
    await sheet(
      fighters.slice(index, index + 8).map(({ id }) => id),
      `expressions-roster-${String(index / 8 + 1).padStart(2, '0')}.png`,
    )
  const special = [
    'illumi',
    'bonolenov',
    'biscuit',
    'melody',
    'gel',
    'saiyu',
    'yokotani',
    'luini',
  ].filter((id) => cards.has(id))
  if (special.length) await sheet(special, 'expressions-specials.png')
}
