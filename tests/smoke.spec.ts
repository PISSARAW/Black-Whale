import { expect, test } from 'playwright/test'

/**
 * The floor under every refactor of ADR-001: if one of these fails, a
 * deployment is broken in a way no unit test would have caught. Each check
 * exercises a different load path — bundled catalogue, database, 3D bundle,
 * spoiler cookie, error boundary — rather than a different page of the same
 * one.
 */

test.describe('smoke — public archive', () => {
  test('the homepage answers and states what the archive holds', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBeLessThan(400)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // The CC BY credit is a licence obligation, not decoration.
    await expect(page.locator('footer').getByText(/CC BY/i).first()).toBeVisible()
  })

  test('the ship page renders from the database', async ({ page }) => {
    const response = await page.goto('/ship')
    expect(response?.status()).toBeLessThan(400)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('the ability archive lists the catalogue', async ({ page }) => {
    const response = await page.goto('/abilities')
    expect(response?.status()).toBeLessThan(400)
    await expect(page.locator('[data-hatsu-id]').first()).toBeVisible()
  })

  test('the tour boots its 3D bundle', async ({ page }) => {
    const response = await page.goto('/tour')
    expect(response?.status()).toBeLessThan(400)
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('canvas').first()).toBeAttached({ timeout: 30_000 })
  })

  test('an unknown path renders the error page, not a bare 404', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist')
    expect(response?.status()).toBe(404)
    // `+error.svelte` states the reference; SvelteKit's built-in page does not.
    await expect(page.getByText(/Reference 404|Référence 404/)).toBeVisible()
  })
})

test.describe('smoke — spoiler cap', () => {
  test('a capped reader is served fewer abilities than an uncapped one', async ({ page }) => {
    await page.goto('/abilities')
    const uncapped = await page.locator('[data-hatsu-id]').count()
    expect(uncapped).toBeGreaterThan(0)

    await page
      .context()
      .addCookies([{ name: 'userSpoilerLimit', value: '0', domain: '127.0.0.1', path: '/' }])
    // Reloaded rather than navigated again: the client router treats a second
    // `goto` to the page it is already on as a navigation to interrupt.
    await page.reload()
    // The count is a server-rendered fact, but hydration re-renders the list, so
    // poll rather than read once.
    await expect.poll(() => page.locator('[data-hatsu-id]').count()).toBeLessThan(uncapped)
  })
})

test.describe('smoke — casting a Hatsu', () => {
  test('activating a technique from the archive puts it on screen', async ({ page }) => {
    await page.goto('/abilities')
    const first = page.locator('[data-hatsu-id]').filter({ has: page.locator('[data-hatsu-pass]') })
    await expect(first.first()).toBeVisible()
    const id = await first.first().getAttribute('data-hatsu-id')
    expect(id).toBeTruthy()

    await first.first().locator('[data-hatsu-pass]').click()
    // The dock only offers a release while a technique is actually in hand, so
    // its presence is the honest signal that the cast took.
    await expect(page.locator('[data-hatsu-release]')).toBeVisible({ timeout: 10_000 })
  })
})
