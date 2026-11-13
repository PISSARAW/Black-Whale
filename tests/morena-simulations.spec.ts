import { expect, test, type Locator } from 'playwright/test'

async function activate(locator: Locator, touch: boolean) {
  await locator.scrollIntoViewIfNeeded()
  if (touch) await locator.tap()
  else {
    await locator.focus()
    await locator.press('Enter')
  }
}

async function openGame(panel: Locator, touch: boolean) {
  const candidate = panel.getByLabel('Candidate')
  const candidateId = await candidate.locator('option').nth(1).getAttribute('value')
  expect(candidateId, 'the branch needs a candidate besides Morena').toBeTruthy()
  await candidate.selectOption(candidateId!)
  await activate(panel.getByRole('button', { name: 'Open a Morena game' }), touch)
}

async function playToVerdict(panel: Locator, touch: boolean) {
  for (let move = 0; move < 12; move += 1) {
    const witness = panel.getByRole('button', { name: 'Witness the murder' })
    if (await witness.isVisible()) return true
    if (await panel.getByRole('button', { name: 'Close the game effect' }).isVisible()) return false

    const questions = panel.getByRole('button', { name: /^Ask ·/ })
    if (await questions.count()) {
      await activate(questions.first(), touch)
      continue
    }

    const kisses = panel.getByRole('button', { name: /^Kiss · recover/ })
    if (await kisses.count()) {
      const marked = panel.getByRole('button', { name: 'Kiss · recover back' })
      await activate((await marked.count()) > 0 ? marked : kisses.first(), touch)
      continue
    }

    const yes = panel.getByRole('button', { name: 'Settle as yes' })
    if (await yes.count()) {
      await activate(yes, touch)
      continue
    }

    const recovered = panel.getByRole('button', { name: /^Recover / })
    if (await recovered.count()) {
      await activate(recovered.first(), touch)
      continue
    }

    const lastCard = panel.getByRole('button', { name: /^Play / })
    if (await lastCard.count()) {
      await activate(lastCard, touch)
      continue
    }

    throw new Error(`No legal Morena branch move was rendered:\n${await panel.innerText()}`)
  }
  throw new Error('The Morena branch did not reach a verdict in twelve moves')
}

test.describe('Morena in simulation branches', () => {
  test('plays from the network opening through a recorded kill', async ({ page, isMobile }) => {
    test.slow()
    const response = await page.goto('/simulations')
    expect(response?.status()).toBeLessThan(400)
    await activate(page.getByRole('button', { name: 'Create branch' }), isMobile)
    await expect(page).toHaveURL(/\?branch=/)

    const branchId = new URL(page.url()).searchParams.get('branch')
    expect(branchId).toBeTruthy()
    const rejected = await page.request.post('/simulations?/morena', {
      form: { branchId: branchId!, command: 'witness-murder', actorId: 'hisoka' },
    })
    expect(rejected.status()).toBe(400)

    const panel = page.getByTestId('morena-branch-panel')
    await expect(panel).toBeVisible()
    await activate(panel.getByRole('button', { name: 'Open the 22-member network' }), isMobile)
    await expect(panel).toContainText('Network · 0 / 22')

    let eligible = false
    for (let attempt = 0; attempt < 5 && !eligible; attempt += 1) {
      await openGame(panel, isMobile)
      eligible = await playToVerdict(panel, isMobile)
      if (!eligible) {
        await activate(panel.getByRole('button', { name: 'Close the game effect' }), isMobile)
      }
    }
    expect(eligible, 'one of five marked deals should produce Yes plus the kiss').toBe(true)

    await activate(panel.getByRole('button', { name: 'Witness the murder' }), isMobile)
    await activate(panel.getByRole('button', { name: 'Infect candidate at level 0' }), isMobile)

    const dashboard = page.getByTestId('contagion-dashboard')
    await expect(panel).toContainText('Network · 1 / 22')
    await expect(panel.locator('.member')).toContainText('level 0')
    await expect(dashboard).toContainText('1 / 22')

    await activate(panel.getByRole('button', { name: 'nen-user +10' }), isMobile)
    await expect(panel.locator('.member')).toContainText('level 10')
    await expect(dashboard.locator('li[title*="Level 10"]')).toHaveCount(1)
  })
})
