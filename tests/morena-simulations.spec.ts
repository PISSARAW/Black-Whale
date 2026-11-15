import { expect, test, type Locator } from 'playwright/test'

async function openGame(panel: Locator) {
  const candidate = panel.getByLabel('Candidate')
  const candidateId = await candidate.locator('option').nth(1).getAttribute('value')
  expect(candidateId, 'the branch needs a candidate besides Morena').toBeTruthy()
  await candidate.selectOption(candidateId!)
  await panel.getByRole('button', { name: 'Open a Morena game' }).click()
  await expect(panel.locator('.metrics')).toBeVisible()
}

test.describe('Morena in simulation branches', () => {
  test('opens the network and a playable negotiation', async ({ page, isMobile }) => {
    test.skip(
      isMobile,
      'Morena touch interactions are covered in morena.spec; branch semantics need one browser.',
    )

    const response = await page.goto('/simulations')
    expect(response?.status()).toBeLessThan(400)
    await page.getByRole('button', { name: 'Create branch' }).click()
    await expect(page).toHaveURL(/\?branch=/)

    const branchId = new URL(page.url()).searchParams.get('branch')
    expect(branchId).toBeTruthy()
    const rejected = await page.request.post('/simulations?/morena', {
      form: { branchId: branchId!, command: 'witness-murder', actorId: 'hisoka' },
      headers: {
        origin: new URL(page.url()).origin,
        accept: 'application/json',
        'x-sveltekit-action': 'true',
      },
    })
    expect(rejected.status()).toBe(200)
    await expect(rejected.json()).resolves.toMatchObject({ type: 'failure', status: 400 })

    const panel = page.getByTestId('morena-branch-panel')
    await expect(panel).toBeVisible()
    const openNetwork = panel.getByRole('button', { name: 'Open the 22-member network' })
    await expect(openNetwork).toBeEnabled()
    await openNetwork.click()
    await expect(openNetwork).toHaveCount(0)

    await openGame(panel)
    await expect(panel.locator('.metrics')).toContainText('Phase')
    await expect(panel.locator('.metrics')).toContainText('Round')
    await expect(panel.locator('.metrics')).toContainText('Answers')
    await expect(panel.getByRole('button', { name: /^Ask ·/ }).first()).toBeVisible()
  })
})
