import { expect, test } from 'playwright/test'

/**
 * The back-office runs on its own origin, so these tests do not use the shared
 * `baseURL`. They check the gate end to end: unit tests already cover the
 * session token, this covers the wiring around it.
 */
const ADMIN = 'http://127.0.0.1:4174'
const PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin'

test.describe('smoke — back-office', () => {
  test('sends an anonymous visitor to the login form and remembers the target', async ({
    page,
  }) => {
    await page.goto(`${ADMIN}/characters`)
    await expect(page).toHaveURL(/\/login\?next=%2Fcharacters/)
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('refuses a wrong password without issuing a session', async ({ page }) => {
    await page.goto(`${ADMIN}/login`)
    await page.locator('input[name="password"]').fill('not the password')
    await page.getByRole('button', { name: /se connecter/i }).click()

    await expect(page).toHaveURL(/\/login/)
    const cookies = await page.context().cookies(ADMIN)
    expect(cookies.find((cookie) => cookie.name === 'bw_admin_session')).toBeUndefined()
  })

  test('lets the right password in and lands on the page that was asked for', async ({ page }) => {
    await page.goto(`${ADMIN}/characters`)
    await page.locator('input[name="password"]').fill(PASSWORD)
    await page.getByRole('button', { name: /se connecter/i }).click()

    await expect(page).toHaveURL(`${ADMIN}/characters`)
    const session = (await page.context().cookies(ADMIN)).find(
      (cookie) => cookie.name === 'bw_admin_session',
    )
    expect(session?.httpOnly).toBe(true)
    expect(session?.sameSite).toBe('Strict')
  })

  test('never lets the back-office be indexed or cached', async ({ request }) => {
    const response = await request.get(`${ADMIN}/login`)
    expect(response.headers()['x-robots-tag']).toContain('noindex')
    expect(response.headers()['cache-control']).toBe('no-store, private')
    expect(response.headers()['x-frame-options']).toBe('DENY')
  })

  test('answers the API with 401 JSON rather than an HTML redirect', async ({ request }) => {
    const response = await request.get(`${ADMIN}/api/characters`, { maxRedirects: 0 })
    expect(response.status()).toBe(401)
    expect(await response.json()).toEqual({ message: 'Unauthorized' })
  })
})
