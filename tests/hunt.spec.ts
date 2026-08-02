import { expect, test } from 'playwright/test'

test.describe('Hunt V3 critical path', () => {
  test.beforeEach(async ({ page }) => {
    const response = await page.goto('/hunt')
    expect(response?.status()).toBeLessThan(400)
  })

  test('selects terrain, hunter and Hatsu before beginning', async ({ page }) => {
    const terrain = page.getByRole('button', { name: /Tubeppa/ })
    await terrain.click()
    await expect(terrain).toHaveAttribute('aria-pressed', 'true')

    const hunter = page.getByRole('button', { name: /aggressive/i })
    await hunter.click()
    await expect(hunter).toHaveAttribute('aria-pressed', 'true')

    const hatsu = page.getByRole('button', { name: /Parallel Future/i })
    await hatsu.click()
    await expect(hatsu).toHaveAttribute('aria-pressed', 'true')

    await page.getByRole('button', { name: 'Enter the apartment' }).click()
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('exposes sound and gameplay controls to assistive technology', async ({ page }) => {
    const sound = page.getByRole('button', { name: 'Enable sound' })
    await expect(sound).toHaveAttribute('aria-pressed', 'false')
    await page.getByRole('button', { name: 'Enter the apartment' }).click()
    await expect(page.locator('[aria-live="polite"]')).toBeAttached()
    await expect(page.getByRole('button', { name: /Zetsu/ })).toBeVisible()
  })

  test('selects a contract and vow, then exposes advanced Nen actions', async ({ page }) => {
    const siege = page.getByRole('button', { name: /Blackout siege/i })
    await siege.click()
    await expect(siege).toHaveAttribute('aria-pressed', 'true')

    const vow = page.getByRole('button', { name: /Silent Hunt/i })
    await vow.click()
    await expect(vow).toHaveAttribute('aria-pressed', 'true')

    await page.getByRole('button', { name: 'Enter the apartment' }).click()
    const advancedNen = page.getByRole('navigation', { name: /Advanced Nen/i })
    await expect(advancedNen.getByRole('button', { name: /Ren/ })).toBeVisible()
    await expect(advancedNen.getByRole('button', { name: /Shu/ })).toBeVisible()
  })

  test('creates and opens a validated shared contract', async ({ page }) => {
    await page.getByRole('link', { name: /Create and share a contract/i }).click()
    await expect(page.getByRole('heading', { name: 'Contract editor' })).toBeVisible()

    await page.getByLabel('English title').fill('Silent Meridian')
    await page.getByLabel('Lighting').selectOption('blackout')
    await page.getByRole('link', { name: /Play and share this contract/i }).click()

    const shared = page.getByRole('button', { name: /Silent Meridian/i })
    await expect(shared).toBeVisible()
    await expect(shared).toHaveAttribute('aria-pressed', 'true')
    await expect(page).toHaveURL(/contract=/)
  })
})
