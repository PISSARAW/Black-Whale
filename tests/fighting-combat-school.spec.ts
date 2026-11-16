import { expect, test, type Page } from 'playwright/test'

const school = (page: Page) => page.getByRole('region', { name: 'École de combat', exact: true })
async function catalog(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const details = school(page).locator(':scope > details')
  if ((await details.getAttribute('open')) === null) {
    const summary = details.locator(':scope > summary')
    await summary.evaluate((node) => node.scrollIntoView({ block: 'center' }))
    await summary.click()
  }
}
async function selectFighter(page: Page, fighter: string) {
  await catalog(page)
  await page.getByLabel('Personnage des exercices', { exact: true }).selectOption(fighter)
}
const names = [
  'Confirmer une touche',
  'Conversion sur attaque basse',
  'Punition engagée',
  'Conversion aérienne',
]
for (const fighter of ['kurapika', 'hisoka', 'chrollo', 'benjamin']) {
  test(`${fighter}: all four demonstrations complete through the real combat loop`, async ({
    page,
  }) => {
    // Four real-time fights share this test. Software WebGL can advance the
    // fixed-step simulation much slower than the display's nominal 60 Hz.
    test.setTimeout(240_000)
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/fr/fighting', { waitUntil: 'networkidle' })
    for (const name of names) {
      await selectFighter(page, fighter)
      await school(page)
        .getByRole('button', { name: `Démontrer · ${name}`, exact: true })
        .click()
      await expect(school(page).getByRole('status')).toHaveText('Exercice réussi !', {
        timeout: 60000,
      })
      await expect(page.locator('.fight-scene.failed')).toHaveCount(0)
    }
    await school(page).getByRole('button', { name: 'Terminer l’exercice', exact: true }).click()
    await expect(page.locator('.response-diagnostics')).toBeVisible()
    expect(errors).toEqual([])
  })
}

test('manual practice rejects a different starter, resets cleanly and pauses the demonstration', async ({
  page,
}) => {
  await page.goto('/fr/fighting', { waitUntil: 'networkidle' })
  await selectFighter(page, 'kurapika')
  await school(page)
    .getByRole('button', { name: `Pratiquer · ${names[0]}`, exact: true })
    .click()
  await page.keyboard.press('k')
  await expect(school(page).getByRole('status')).toContainText('ne correspond pas')
  await school(page).getByRole('button', { name: 'Réessayer l’exercice', exact: true }).click()
  await expect(school(page).getByRole('status')).toContainText('Commence la route')
  await page.locator('.pause-fight').click()
  await school(page).getByRole('button', { name: 'Voir la démonstration', exact: true }).click()
  await page.locator('.pause-fight').click()
  await expect(page.locator('.pause-fight')).toHaveText('Reprendre')
  const frozen = await school(page).locator('.active-exercise > span').innerText()
  await page.waitForTimeout(500)
  await expect(school(page).locator('.active-exercise > span')).toHaveText(frozen)
  await page.locator('.pause-fight').click()
  await expect(school(page).getByRole('status')).toHaveText('Exercice réussi !')
  await school(page).getByRole('button', { name: 'Terminer l’exercice', exact: true }).click()
  await page.getByLabel('Mannequin', { exact: true }).selectOption('random-guard')
  await expect(page.getByLabel('Mannequin', { exact: true })).toHaveValue('random-guard')
})

async function localFight(page: Page) {
  await page.goto('/fr/fighting', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Versus local', exact: true }).click()
  await page.locator('.selection-summary button').click()
  await expect(page.locator('.ready-overlay')).toBeVisible()
  await page.locator('.ready-overlay button').click()
  await page.locator('.display-settings > summary').click()
}
test('camera preference persists, respects reduced motion and fits a narrow screen', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await localFight(page)
  const camera = page.getByLabel('Caméra dynamique', { exact: true })
  await camera.selectOption('0.5')
  await localFight(page)
  await expect(camera).toHaveValue('0.5')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(camera).toHaveValue('0')
  await expect(camera).toBeDisabled()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(camera).toHaveValue('0.5')
  await expect(camera).toBeEnabled()
  const box = await page.locator('.settings-panel').boundingBox()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(390)
  await page.screenshot({
    path: '/tmp/black-whale-combat-school/mobile-settings.png',
    fullPage: true,
  })
})

test('defense exercise confirms the guard and explains a missed punish opening', async ({
  page,
}) => {
  await page.goto('/fr/fighting', { waitUntil: 'networkidle' })
  await selectFighter(page, 'kurapika')
  await school(page)
    .getByRole('button', { name: 'Défense · bloquer puis punir', exact: true })
    .click()
  const instruction = await school(page).locator('.active-exercise').innerText()
  const guard = instruction.match(/Garde\s*:\s*(\S+)/u)![1]
  const key = guard === 'Maj' ? 'Shift' : guard
  await page.keyboard.down(key)
  await expect(school(page).getByRole('status')).toContainText(
    'L’ouverture de punition est passée.',
    {
      timeout: 30000,
    },
  )
  await page.keyboard.up(key)
  await expect(school(page).locator('.active-exercise > span')).toHaveText('1 / 2')
})
