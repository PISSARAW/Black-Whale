import { expect, test, type Page } from 'playwright/test'
import { matchTopic } from '../apps/web/src/lib/tour/cast/askRouting'
import { liveQuestion } from './production-question'

test.skip(
  !process.env.BLACK_WHALE_PRODUCTION_URL,
  'Live inference requires an explicit production URL',
)

for (const [locale, query] of [
  ['fr', 'où peut-on prendre un repas'],
  ['en', 'where can I get a meal'],
] as const) {
  test(`live room interpretation (${locale})`, async ({ request }) => {
    const response = await request.post('/tour/search', {
      data: { query: liveQuestion(query), locale },
      timeout: 30_000,
    })
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).not.toHaveProperty('reason')
    expect(body.keywords.length).toBeGreaterThan(0)
    expect(body.keywords.length).toBeLessThanOrEqual(5)
    expect(body.keywords.every((word: unknown) => typeof word === 'string')).toBe(true)
  })
}

for (const [locale, query] of [
  ['fr', 'Tu roules pour la Mafia ?'],
  ['en', 'Whose orders would you obey?'],
] as const) {
  test(`live archive routing without a phrase match (${locale})`, async ({ request }) => {
    expect(matchTopic(query)).toBeNull()
    const utterance = liveQuestion(query)
    expect(matchTopic(utterance)).toBeNull()
    const response = await request.post('/tour/ask', {
      data: { query: utterance, locale },
      timeout: 30_000,
    })
    expect(response.status()).toBe(200)
    expect(await response.json()).toEqual({ topic: 'allegiance' })
  })
}

test('invalid inputs are rejected and known phrases still work', async ({ request }) => {
  for (const route of ['/tour/search', '/tour/ask']) {
    const malformed = await request.post(route, { data: { query: 42, locale: 'fr' } })
    expect(malformed.status()).toBe(400)
    expect((await malformed.json()).reason).toBe('rejected')
  }
  const response = await request.post('/tour/ask', {
    data: { query: 'Et votre Nen ?', locale: 'fr' },
  })
  expect(await response.json()).toEqual({ topic: 'nen' })
})

async function ready(page: Page) {
  await page.goto('/fr/tour?mangaView=benjamin-living-guards')
  await expect(
    page.locator('#tour-stage-container').getByText('Salon — 1001 (Benjamin)', { exact: true }),
  ).toBeVisible()
}

test('the room finder displays real model results and navigates', async ({ page }, testInfo) => {
  await ready(page)
  await page.getByRole('button', { name: 'Chercher une pièce', exact: true }).click()
  const dialog = page.getByRole('dialog')
  const response = page.waitForResponse(
    (r) => r.url().endsWith('/tour/search') && r.request().method() === 'POST',
  )
  await dialog.getByRole('textbox').fill(liveQuestion('où trouver de quoi déjeuner'))
  const body = await (await response).json()
  expect(body).not.toHaveProperty('reason')
  expect(body.keywords.length).toBeGreaterThan(0)
  await expect(dialog).toContainText('Compris comme')
  await page.screenshot({ path: testInfo.outputPath('finder.png') })
  await dialog
    .getByRole('button')
    .filter({ hasText: /Cuisine|Réfectoire|Restaurant|Salle à manger|Cafétéria/i })
    .first()
    .click()
  await expect(dialog).toBeHidden()
})

test('a character answers a free question with the sourced archive line', async ({
  page,
}, testInfo) => {
  await ready(page)
  const canvas = page.locator('#tour-stage-container canvas').first()
  await canvas.click()
  const archive = page.getByRole('button', { name: 'Interroger les archives', exact: true })
  // Sweep the reticle through the inhabited scene using its actual look events.
  // No application state, network response or model output is mocked.
  for (let turn = 0; turn < 50; turn++) {
    await page.evaluate(() =>
      document.dispatchEvent(
        new MouseEvent('mousemove', { movementX: 60, movementY: 0, bubbles: true }),
      ),
    )
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    )
    await page.keyboard.press('p')
    if (await archive.isVisible()) break
    await page.keyboard.press('p')
  }
  await expect(archive).toBeVisible()
  await page.keyboard.press('Tab')
  await archive.click()
  const card = page.locator('aside.address')
  await expect(card).toBeVisible()
  const query = liveQuestion('Obéis-tu aux ordres de la famille royale ?')
  expect(matchTopic(query)).toBeNull()
  await card.getByRole('textbox').fill(query)
  const response = page.waitForResponse(
    (r) => r.url().endsWith('/tour/ask') && r.request().method() === 'POST',
  )
  await card.getByRole('button', { name: 'Demander', exact: true }).click()
  expect(await (await response).json()).toEqual({ topic: 'allegiance' })
  await expect(card).toContainText('L’archive y répond par')
  await expect(card).toContainText('Pour qui êtes-vous à bord ?')
  await expect(card).toContainText('Aucune de ces lignes n’est une réplique')
  await page.screenshot({ path: testInfo.outputPath('archive.png') })
})
