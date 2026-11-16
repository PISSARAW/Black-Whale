import { expect, test } from 'playwright/test'

for (const locale of ['fr', 'en']) {
  test(`Nen archive renders and animates a selected model in ${locale}`, async ({ page }, info) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(locale === 'fr' ? '/fr/nen-archive' : '/nen-archive')
    await expect(page.getByRole('heading', { name: 'NenDex', level: 1 })).toBeVisible()
    await expect(page.locator('.model-loading')).toHaveCount(0)
    const canvas = page.locator('.viewer canvas')
    await expect(canvas).toBeVisible()
    await expect.poll(async () => (await canvas.boundingBox())?.height ?? 0).toBeGreaterThan(200)
    await page.locator('.catalogue input[type="search"]').fill('Blinky')
    await expect(page.locator('.entry-list button')).toHaveCount(1)
    await page.locator('.entry-list button').click()
    await expect(page.locator('#specimen-name')).toHaveText('Blinky')
    await expect(page.locator('.model-loading')).toHaveCount(0)
    await page.locator('.technique-card button').click()
    await expect(page.locator('.archive')).toHaveClass(/technique-active/)
    await page.screenshot({ path: info.outputPath(`nen-archive-${locale}.png`), fullPage: true })
    expect(errors).toEqual([])
  })
}
