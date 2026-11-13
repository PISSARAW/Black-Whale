import { expect, test, type Locator, type Page } from 'playwright/test'

const distanceOf = async (page: Page) => {
  const text = await page.locator('.match-rule small').innerText()
  return Number(text.match(/[\d.]+/)?.[0] ?? Number.NaN)
}

const control = (page: Page, mobile: boolean, action: 'guard' | 'strike'): Locator => {
  if (mobile) {
    const position = action === 'strike' ? 1 : 2
    return page.locator(`.touch-combat button:nth-child(${position})`)
  }
  const position = action === 'strike' ? 1 : 3
  return page.locator(`.ryu-card .actions button:nth-child(${position})`)
}

const activate = async (button: Locator, mobile: boolean) => {
  await expect(button).toBeVisible()
  if (mobile) await button.tap()
  else await button.click()
}

test.describe('Arena playable journey', () => {
  test('waits for the player and reaches a verdict on desktop and mobile', async ({
    page,
    isMobile,
  }) => {
    test.slow()
    const response = await page.goto(
      '/arena?opponent=custom&doctrine=counter&difficulty=initiate&format=sudden-death',
    )
    expect(response?.status()).toBeLessThan(400)

    const enter = page.getByRole('button', { name: 'Enter the arena' })
    await expect(enter).toBeVisible({ timeout: 30_000 })
    if (isMobile) await enter.tap()
    else await enter.click()

    await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 })
    const openingDistance = await distanceOf(page)
    await page.waitForTimeout(1_200)
    expect(await distanceOf(page)).toBeCloseTo(openingDistance, 1)

    await activate(control(page, isMobile, 'guard'), isMobile)
    await expect.poll(() => distanceOf(page), { timeout: 15_000 }).toBeLessThan(openingDistance)
    await expect.poll(() => distanceOf(page), { timeout: 20_000 }).toBeLessThan(2.5)

    const strike = control(page, isMobile, 'strike')
    const verdict = page.locator('.verdict')
    for (let attempt = 0; attempt < 24 && !(await verdict.isVisible()); attempt += 1) {
      await activate(strike, isMobile)
      await page.waitForTimeout(450)
    }

    await expect(verdict).toBeVisible()
    await expect(verdict.getByRole('button', { name: /Restart/i })).toBeVisible()
  })

  test('honours custom URL options and exposes complete campaign presets', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'configuration semantics only need one browser viewport')
    await page.goto('/arena?opponent=custom&doctrine=binder&difficulty=master')
    await page.getByRole('button', { name: 'Enter the arena' }).click()
    await expect(page.locator('.opponent-card strong')).toHaveText("L'Entraveuse")

    const firstMission = page.locator('.campaign-picker a').first()
    await expect(firstMission).toHaveAttribute('data-sveltekit-reload', '')
    await expect(firstMission).toHaveAttribute(
      'href',
      /terrain=.*challenge=.*doctrine=.*difficulty=.*format=.*opponent=.*mission=/,
    )
  })
})
