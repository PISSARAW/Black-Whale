import { expect, test, type APIRequestContext, type Page } from 'playwright/test'
import type { SearchResponse } from '../apps/web/src/lib/search/types'
import { liveQuestion } from './production-question'

test.skip(!process.env.BLACK_WHALE_PRODUCTION_URL, 'Requires an explicit live production URL')

async function cap(request: APIRequestContext, chapter?: number) {
  const response = await request.post('/spoiler-limit', {
    form:
      chapter === undefined
        ? { intent: 'clear', chapter: '', redirectTo: '/' }
        : { chapter: String(chapter), redirectTo: '/' },
    headers: { origin: new URL(process.env.BLACK_WHALE_PRODUCTION_URL!).origin },
    maxRedirects: 0,
  })
  expect(response.status()).toBe(303)
}

async function search(
  request: APIRequestContext,
  query: string,
  options: { locale?: string; semantic?: boolean } = {},
) {
  const response = await request.post('/search', {
    data: { query, locale: 'en', ...options },
    timeout: 30_000,
  })
  expect(response.status()).toBe(200)
  expect(response.headers()['cache-control']).toBe('private, no-store')
  expect(
    response
      .headers()
      .vary.toLowerCase()
      .split(/\s*,\s*/),
  ).toContain('cookie')
  return (await response.json()) as SearchResponse
}

test('French natural language applies the requested type and Nen category', async ({ request }) => {
  const body = await search(request, liveQuestion('Montre les pouvoirs de manipulation'), {
    locale: 'fr',
  })
  expect(body.mode).toBe('ai')
  expect(body.results.length).toBeGreaterThan(0)
  expect(body.results.every((result) => result.kind === 'ability')).toBe(true)
  expect(body.results.some((result) => result.id === 'ability:black-voice')).toBe(true)
  const translated = await search(request, 'Bungee Gum', { locale: 'fr', semantic: false })
  expect(translated.results.find((result) => result.id === 'ability:bungee-gum')?.excerpt).toMatch(
    /caoutchouc/i,
  )
})

test('English natural language finds a power by its properties', async ({ request }) => {
  const body = await search(request, liveQuestion('Find powers using rubber and chewing gum'))
  expect(body.mode).toBe('ai')
  expect(body.results[0].id).toBe('ability:bungee-gum')
})

test('natural language also searches rooms across the ship', async ({ request }) => {
  const body = await search(request, liveQuestion('où peut-on manger à bord'), { locale: 'fr' })
  expect(body.mode).toBe('ai')
  expect(body.results.length).toBeGreaterThan(0)
  expect(
    body.results.every(
      (result) => result.kind === 'place' && result.href.startsWith('/tour?space='),
    ),
  ).toBe(true)
})

test('full, capped and zero-cap readers cannot share result data', async ({ request }) => {
  for (const chapter of [undefined, 399, 415, 0, undefined]) {
    await cap(request, chapter)
    const body = await search(request, 'Komiya', { semantic: false })
    expect(body.spoilerLimit).toBe(chapter ?? null)
    if (chapter === undefined || chapter >= 415)
      expect(body.results.some((r) => r.id === 'character:komiya')).toBe(true)
    else expect(JSON.stringify(body)).not.toContain('Komiya')
  }
})

test('a body-provided spoiler limit cannot widen the cookie cap', async ({ request }) => {
  await cap(request, 399)
  const response = await request.post('/search?maxChapter=9999', {
    data: { query: 'Komiya', locale: 'fr', semantic: false, spoilerLimit: 9999, maxChapter: 9999 },
  })
  const body = await response.json()
  expect(body.spoilerLimit).toBe(399)
  expect(JSON.stringify(body)).not.toContain('Komiya')
  const identities = await search(request, "Oito's Nephew", { semantic: false })
  expect(JSON.stringify(identities)).not.toContain('oito-nephew-fake-woble')
  await cap(request, 350)
  const aliases = await search(request, 'Grim Reaper', { semantic: false })
  expect(aliases.results.some((r) => r.id === 'character:hisoka')).toBe(false)
})

test('opening a known ability under a cap does not reveal later catalogue prose', async ({
  request,
}) => {
  await cap(request, 350)
  const results = await search(request, 'Black Voice', { semantic: false })
  const ability = results.results.find((r) => r.id === 'ability:black-voice')!
  expect(ability).toBeTruthy()
  expect(ability.excerpt).toBe('')
  const page = await request.get(ability.href)
  expect(page.status()).toBe(200)
  const html = await page.text()
  expect(html).toContain('Catalogue details without a chapter date are hidden')
  expect(html).not.toContain("Shalnark's death")
  expect(html).not.toContain('presumably disappeared')
})

async function open(page: Page, path: string, french: boolean) {
  await page.goto(path)
  await page.keyboard.press('ControlOrMeta+k')
  const dialog = page.getByRole('dialog', {
    name: french ? 'Navigation rapide' : 'Quick navigation',
    exact: true,
  })
  await expect(dialog).toBeVisible()
  return dialog
}

test('French global search works from a catalogue page and opens a real result', async ({
  page,
}, testInfo) => {
  const dialog = await open(page, '/fr/characters', true)
  const input = dialog.getByRole('textbox')
  await input.fill('Quels pouvoirs reposent sur la manipulation ?')
  const pending = page.waitForResponse(
    (r) => new URL(r.url()).pathname === '/search' && r.request().method() === 'POST',
  )
  await input.press('Enter')
  const body = (await (await pending).json()) as SearchResponse
  expect(body.mode).toBe('ai')
  expect(body.results.length).toBeGreaterThan(0)
  await expect(dialog.locator('.site-search ol button').first()).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('global-search-fr.png') })
  await dialog.locator('.site-search ol button').first().click()
  await expect(page).toHaveURL(new RegExp(`/fr${body.results[0].href}$`))
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('English keyboard search opens the first semantic result from the timeline', async ({
  page,
}) => {
  const dialog = await open(page, '/timeline', false)
  const input = dialog.getByRole('textbox')
  await input.fill('Find powers using rubber and chewing gum')
  const pending = page.waitForResponse(
    (r) => new URL(r.url()).pathname === '/search' && r.request().method() === 'POST',
  )
  await input.press('Enter')
  expect((await (await pending).json()).mode).toBe('ai')
  await expect(dialog.locator('.site-search ol button').first()).toContainText('Bungee Gum')
  await input.press('Enter')
  await expect(page).toHaveURL(/\/abilities\/bungee-gum$/)
})

test('the palette does not retain full-canon results after changing the chapter', async ({
  page,
}) => {
  let dialog = await open(page, '/fr/about', true)
  await dialog.getByRole('textbox').fill('Komiya')
  let pending = page.waitForResponse((r) => new URL(r.url()).pathname === '/search')
  await dialog.getByRole('textbox').press('Enter')
  expect(
    (await (await pending).json()).results.some((r: { id: string }) => r.id === 'character:komiya'),
  ).toBe(true)
  await cap(page.request, 399)
  await page.reload()
  await page.keyboard.press('ControlOrMeta+k')
  dialog = page.getByRole('dialog', { name: 'Navigation rapide', exact: true })
  await expect(dialog.locator('.site-search ol')).toHaveCount(0)
  await dialog.getByRole('textbox').fill('Komiya')
  pending = page.waitForResponse((r) => new URL(r.url()).pathname === '/search')
  await dialog.getByRole('textbox').press('Enter')
  const body = await (await pending).json()
  expect(body.spoilerLimit).toBe(399)
  expect(JSON.stringify(body)).not.toContain('Komiya')
  await expect(dialog.locator('.site-search')).toContainText('Aucun résultat')
})

test('global search is reachable from the mobile navigation menu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/fr/abilities')
  await page.locator('.menu-toggle').click()
  await page.locator('.menu-search').click()
  const dialog = page.getByRole('dialog', { name: 'Navigation rapide', exact: true })
  await expect(dialog.getByRole('textbox')).toBeFocused()
  await dialog.getByRole('textbox').fill('Kurapika')
  await dialog.getByRole('textbox').press('Enter')
  await expect(dialog.locator('.site-search ol button').first()).toContainText('Kurapika')
  await dialog.locator('.site-search ol button').first().click()
  await expect(page).toHaveURL(/\/fr\/characters\/kurapika$/)
})
