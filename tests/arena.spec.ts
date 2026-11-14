import { expect, test, type Locator, type Page } from 'playwright/test'

const distanceOf = async (page: Page) => {
  const text = await page
    .locator('.match-rule small')
    .filter({ hasText: /distance/i })
    .innerText()
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

const activate = async (button: Locator, mobile: boolean, timeout = 10_000) => {
  await expect(button).toBeVisible()
  if (mobile) await button.tap({ timeout })
  else await button.click({ timeout })
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

    const guard = control(page, isMobile, 'guard')
    if (isMobile) await activate(guard, true)
    else {
      await expect(guard).toBeVisible()
      await guard.dispatchEvent('click')
    }
    await expect.poll(() => distanceOf(page), { timeout: 20_000 }).toBeLessThan(openingDistance)
    await expect.poll(() => distanceOf(page), { timeout: 20_000 }).toBeLessThan(2.5)

    const strike = control(page, isMobile, 'strike')
    const verdict = page.locator('.verdict')
    for (let attempt = 0; attempt < 24 && !(await verdict.isVisible()); attempt += 1) {
      try {
        await activate(strike, isMobile, 2_000)
      } catch (error) {
        // The opponent can land the sudden-death blow between the visibility
        // check above and this click, disabling the controls as the verdict is
        // rendered. That is a successful end state, not a stuck control.
        if (!(await verdict.isVisible())) throw error
      }
      await page.waitForTimeout(450)
    }

    await expect(verdict).toBeVisible()
    await expect(verdict.getByRole('button', { name: /Fight again|Recombattre/i })).toBeVisible()
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

    await page.goto(
      '/arena?terrain=tier-2-screening-room&challenge=in-gyo&doctrine=deceiver&difficulty=fighter&format=first-to-three&opponent=in-examiner&mission=hidden-aura',
    )
    await page.getByRole('button', { name: 'Enter the arena' }).click()
    await expect(page.locator('.opponent-card strong')).toHaveText('In Examiner')
    await expect(page.getByLabel('Difficulty')).toHaveValue('fighter')
  })

  test('creates an authoritative PvP invite and synchronises two players', async ({
    browser,
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'one desktop project covers the two independent browser contexts')

    await page.goto('/arena/pvp')
    await page.getByRole('button', { name: 'Create duel' }).click()
    await expect(page).toHaveURL(/\/arena\/pvp\/[0-9a-f-]+$/)
    const invite = page.url()

    const guestContext = await browser.newContext()
    const guest = await guestContext.newPage()
    try {
      await guest.goto(invite)
      await guest.getByRole('button', { name: 'Join duel' }).click()

      await expect(page.getByText('First to 3', { exact: true })).toBeVisible()
      await expect(guest.getByText('First to 3', { exact: true })).toBeVisible()
      await expect(page.getByText(/You · player/i)).toBeVisible()
      await expect(guest.getByText(/You · opponent/i)).toBeVisible()

      const openingGap = await pvpGap(page)
      await page.getByRole('button', { name: /Advance/i }).click()
      await expect.poll(() => pvpGap(page), { timeout: 10_000 }).toBeLessThan(openingGap)
      await expect.poll(() => pvpGap(guest), { timeout: 10_000 }).toBeLessThan(openingGap)
    } finally {
      await guestContext.close()
    }
  })
})

async function pvpGap(page: Page): Promise<number> {
  const text = await page.getByText('First to 3', { exact: true }).locator('..').innerText()
  const match = text.match(/([\d.]+)m/)
  return Number(match?.[1] ?? Number.NaN)
}
