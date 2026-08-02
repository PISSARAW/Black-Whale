import { expect, test } from 'playwright/test'

test.describe('Hunt V2 critical path', () => {
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
})
