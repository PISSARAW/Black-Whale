import { expect, test, type Locator, type Page } from 'playwright/test'

async function activate(locator: Locator, touch: boolean) {
  await locator.scrollIntoViewIfNeeded()
  if (touch) await locator.tap()
  else {
    await locator.focus()
    await locator.press('Enter')
  }
}

async function enterGame(page: Page, touch: boolean) {
  const start = page.getByRole('button', { name: 'Sit down opposite Morena', exact: true })
  await expect(start).toBeVisible({ timeout: 20_000 })
  await activate(start, touch)
  const action = page.getByTestId('morena-action')
  await expect(action).toBeVisible()
  return action
}

async function finishGame(page: Page, touch: boolean) {
  for (let step = 0; step < 12; step += 1) {
    const verdict = page.getByTestId('morena-verdict')
    if (await verdict.isVisible()) return verdict

    const action = page.getByTestId('morena-action')
    await expect(action).toBeVisible()
    const heading = action.getByRole('heading', { level: 2 })
    const title = await heading.textContent()

    if (title === 'Spend a question') {
      await activate(action.getByRole('button').first(), touch)
      continue
    }
    if (title === 'She leans across the table') {
      await activate(action.getByRole('button', { name: 'Refuse it', exact: true }), touch)
      continue
    }
    if (title === 'One card left') {
      const play = action.getByRole('button', { name: 'Play it', exact: true })
      if (await play.isDisabled()) await activate(action.getByRole('button').first(), touch)
      await activate(play, touch)
      continue
    }

    throw new Error(`Unknown Morena phase: ${title}`)
  }
  throw new Error('Morena game did not reach a verdict in twelve actions')
}

async function askQuestion(page: Page, title: string, touch: boolean) {
  const action = page.getByTestId('morena-action')
  await expect(action.getByRole('heading', { level: 2 })).toHaveText('Spend a question')
  await activate(action.getByRole('button', { name: title }), touch)
  await expect(page.getByTestId('morena-turn-result')).toContainText(title)
}

test.describe("Morena's negotiation critical path", () => {
  test.beforeEach(async ({ page }) => {
    const response = await page.goto('/tour/morena')
    expect(response?.status()).toBeLessThan(400)
  })

  test('reaches a verdict on desktop and mobile with accessible feedback', async ({
    page,
    isMobile,
  }) => {
    test.slow()
    const start = page.getByRole('button', { name: 'Sit down opposite Morena', exact: true })
    await expect(start).toBeVisible()
    await expect(page.getByTestId('morena-lab')).toHaveCount(0)
    if (isMobile) {
      const box = await start.boundingBox()
      const viewport = page.viewportSize()
      expect(box && viewport && box.y + box.height).toBeLessThanOrEqual(viewport?.height ?? 0)
    }

    const action = await enterGame(page, isMobile)
    const heading = action.getByRole('heading', { level: 2 })
    if (!isMobile) await expect(heading).toBeFocused()
    await expect(page.getByTestId('morena-analysis')).not.toHaveAttribute('open', '')
    expect(
      await page.getByTestId('morena-panel').evaluate((panel) => getComputedStyle(panel).overflowY),
    ).not.toMatch(/auto|scroll/)
    if (isMobile) {
      const sceneHeight = await page
        .getByTestId('morena-scene')
        .evaluate((scene) => scene.getBoundingClientRect().height)
      expect(sceneHeight).toBeLessThanOrEqual((page.viewportSize()?.height ?? 0) * 0.45)
    }

    const announcement = page.getByTestId('morena-announcement')
    await expect(announcement).toContainText('Game started')
    const firstQuestion = action.getByRole('button').first()
    if (isMobile) await firstQuestion.tap()
    else {
      await firstQuestion.focus()
      await firstQuestion.press('Enter')
    }
    await expect(announcement).toContainText('Morena removed')
    await expect(page.getByTestId('morena-turn-result')).toContainText('Morena removed')
    if (!isMobile) {
      await expect(
        page.getByTestId('morena-action').getByRole('heading', { level: 2 }),
      ).toBeFocused()
    }

    const verdict = await finishGame(page, isMobile)
    await expect(verdict).toBeVisible()
    await expect(announcement).toContainText('Final answer')
    if (!isMobile) await expect(verdict.getByRole('heading', { level: 2 })).toBeFocused()

    const openLab = page.getByRole('button', { name: 'Open the Nen Lab', exact: true })
    await expect(openLab).toBeVisible()
    if (isMobile) await openLab.tap()
    else {
      await openLab.focus()
      await openLab.press('Enter')
    }
    await expect(page.getByTestId('morena-lab')).toBeVisible()
    await expect(page.getByTestId('morena-lab-archetype')).toHaveCount(6)
    await expect(page.getByTestId('morena-lab-catalog')).toContainText('All 37 table techniques')

    const width = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }))
    expect(width.page).toBeLessThanOrEqual(width.viewport)
  })

  test('remains fully playable when WebGL is unavailable', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The no-WebGL contract only needs one browser project.')
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null
        return original.call(this, type, ...args)
      } as typeof HTMLCanvasElement.prototype.getContext
    })
    await page.reload()
    await expect(page.getByText(/This table needs WebGL/)).toBeVisible({ timeout: 20_000 })
    await enterGame(page, false)
    await expect(await finishGame(page, false)).toBeVisible()
  })

  test('releases the Hatsu gate after navigation', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Global lifecycle cleanup is covered once in Chromium.')
    await page.addInitScript(() => sessionStorage.setItem('black-whale:hatsu', 'emperor-time'))
    await page.reload()
    await enterGame(page, false)

    await page.getByRole('button', { name: 'Change Hatsu' }).click()
    await page.getByRole('textbox', { name: 'Search Hatsu' }).fill('Bungee Gum')
    const bungee = page.getByRole('button', { name: /Bungee Gum/ })
    await expect(bungee).toBeDisabled()
    await page.getByRole('button', { name: 'Close', exact: true }).click()

    await page.getByRole('link', { name: 'Explore', exact: true }).first().click()
    await expect(page).toHaveURL(/\/ship$/)

    await page.getByRole('button', { name: 'Change Hatsu' }).click()
    await page.getByRole('textbox', { name: 'Search Hatsu' }).fill('Bungee Gum')
    await expect(page.getByRole('button', { name: /Bungee Gum/ })).toBeEnabled()
  })

  test('stops the Emperor Time clock after navigation', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Global lifecycle cleanup is covered once in Chromium.')
    await page.addInitScript(() => {
      sessionStorage.setItem('black-whale:morena-lab', 'true')
      sessionStorage.setItem('black-whale:hatsu', 'emperor-time')
    })
    await page.reload()
    await page.getByRole('button', { name: 'Open the Nen Lab', exact: true }).click()
    await page.getByTestId('morena-lab-archetype').filter({ hasText: 'Emperor Time' }).click()
    await page.getByRole('button', { name: 'Start laboratory game', exact: true }).click()

    await page.getByTestId('morena-analysis').locator('summary').click()
    const emperorTime = page.getByTestId('morena-hatsu-seat')
    await expect(emperorTime).toContainText('Emperor Time')
    await emperorTime.getByRole('button').click()
    await expect
      .poll(() =>
        page.evaluate(() => Number(sessionStorage.getItem('black-whale:emperor-time-hours'))),
      )
      .toBeGreaterThan(0)

    await page.getByRole('link', { name: 'Explore', exact: true }).first().click()
    await expect(page).toHaveURL(/\/ship$/)
    await page.waitForTimeout(100)
    const spent = await page.evaluate(() =>
      Number(sessionStorage.getItem('black-whale:emperor-time-hours')),
    )
    await page.waitForTimeout(1_200)
    const after = await page.evaluate(() =>
      Number(sessionStorage.getItem('black-whale:emperor-time-hours')),
    )
    // The global Hatsu clock intentionally keeps charging one hour per second.
    // Morena's table must stop adding its separate 48-hour tick after unmount.
    expect(after - spent).toBeLessThan(10)
  })

  test('resumes across reload and tab closure with a playable canonical Hatsu', async ({
    page,
    context,
    isMobile,
  }) => {
    await context.addInitScript(() => sessionStorage.setItem('black-whale:hatsu', 'emperor-time'))
    await page.reload()
    const action = await enterGame(page, isMobile)
    const emperorTime = page.getByTestId('morena-hatsu-seat')
    await expect(emperorTime).toContainText('Emperor Time')
    const cast = emperorTime.getByRole('button', { name: 'Read her hand' })
    await activate(cast, isMobile)
    await expect(cast).toBeDisabled()
    await expect(emperorTime).toContainText('Spent')
    await activate(action.getByRole('button').first(), isMobile)
    await page.reload()

    const resume = page.getByTestId('morena-resume')
    await expect(resume).toBeVisible()
    await expect(page.getByTestId('morena-dossier')).toContainText('1 of 7 answers discovered')
    await activate(resume.getByRole('button', { name: 'Resume the hand' }), isMobile)
    await expect(page.getByTestId('morena-turn-result')).toBeVisible()

    await activate(page.getByTestId('morena-action').getByRole('button').first(), isMobile)
    await page.close()

    const reopened = await context.newPage()
    const response = await reopened.goto('/tour/morena')
    expect(response?.status()).toBeLessThan(400)
    await expect(reopened.getByTestId('morena-resume')).toBeVisible()
    await expect(reopened.getByTestId('morena-dossier')).toContainText('2 of 7 answers discovered')
    expect(
      await reopened.evaluate(() => localStorage.getItem('black-whale:morena:save:v1')),
    ).not.toBeNull()
    await activate(
      reopened.getByTestId('morena-resume').getByRole('button', { name: 'Resume the hand' }),
      isMobile,
    )
    await expect(reopened.getByTestId('morena-turn-result')).toBeVisible()
    await expect(reopened.getByTestId('morena-hatsu-seat')).toContainText('Emperor Time')
  })

  test('discovers all seven answers canonically over multiple games', async ({
    page,
    isMobile,
  }) => {
    test.slow()
    await enterGame(page, isMobile)

    for (const question of [
      'What do you actually want?',
      'What is it you would put in me?',
      'What happens if I say yes?',
    ]) {
      await askQuestion(page, question, isMobile)
    }
    await activate(page.getByRole('button', { name: 'Refuse it', exact: true }), isMobile)
    await expect(await finishGame(page, isMobile)).toBeVisible()
    await expect(page.getByTestId('morena-dossier')).toContainText('4 of 7 answers discovered')

    await activate(page.getByRole('button', { name: 'Deal again', exact: true }), isMobile)
    for (const question of [
      'What binds you to any of it?',
      'Where did you come from?',
      'What am I worth to you?',
    ]) {
      await askQuestion(page, question, isMobile)
    }

    const dossier = page.getByTestId('morena-dossier')
    await expect(dossier).toContainText('7 of 7 answers discovered')
    await activate(dossier.locator('summary'), isMobile)
    await expect(dossier.getByText('Answer not yet known')).toHaveCount(0)
    await expect(dossier).toContainText('Twenty-two of you at most')
    await expect(dossier).toContainText('at level twenty')
  })

  test('continues a won and kissed game through the third condition and levels', async ({
    page,
    isMobile,
  }) => {
    const challenge = Buffer.from(
      JSON.stringify({
        v: 2,
        seed: 0,
        detectionSeed: 0xa5a5a5a5,
        streak: 1,
        rounds: 3,
        verdict: 'forced',
        marked: 'back',
        loadout: { technique: null, bookmark: null },
      }),
    ).toString('base64url')
    await page.goto(`/tour/morena?challenge=${challenge}`)
    let action = await enterGame(page, isMobile)
    for (let turn = 0; turn < 3; turn += 1) {
      await activate(action.getByRole('button').first(), isMobile)
      action = page.getByTestId('morena-action')
    }
    await activate(action.locator('button[title*="Back"]'), isMobile)
    await expect(page.getByTestId('morena-epilogue')).toBeVisible()

    // Complete Contagion through the same canonical action wheel used by the
    // catalogue and the main tour. This exercises the surface adapter all the
    // way to the encounter reducer instead of bypassing it through the legacy
    // epilogue shortcut.
    const contagionWheel = page.locator('[data-module-wheel="contagion"]')
    await contagionWheel.locator('summary').click()
    const witness = contagionWheel.locator('button[data-action-id="witness-murder"]')
    await expect(witness).toHaveAttribute('aria-disabled', 'false')
    // Let Playwright resolve and act on the current button atomically: selecting
    // a wheel action updates the Svelte tree, so a separate scroll step can hold
    // the element just as that render replaces it.
    if (isMobile) await witness.tap()
    else await witness.click()
    const network = page.getByTestId('morena-network')
    await expect(network).toContainText('Level 0')
    await activate(network.getByRole('button', { name: 'Nen user · +10' }), isMobile)
    await expect(network).toContainText('Level 10')
  })
})
