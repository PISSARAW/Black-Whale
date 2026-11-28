import { expect, test, type Page } from 'playwright/test'
import { CONTROL_KEYS } from '../apps/web/src/lib/fighting/fightInputBindings'
import { openPauseTab, prepareFight, resumeFight, startPreparedFight } from './helpers/fighting'

const school = (page: Page) => page.getByRole('region', { name: 'École de combat', exact: true })
const objective = (page: Page) => page.locator('.battle-objective').getByRole('status')
async function academy(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/fr/fighting/academy', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Combos & défense/ }).click()
  const time = new Date('2026-11-17T12:00:00Z')
  await page.clock.install({ time })
  await page.clock.pauseAt(new Date(time.getTime() + 1000))
}
async function advanceCombat(page: Page, batches: number) {
  await expect(page.locator('.fight-scene canvas')).toHaveAttribute('data-engine', /three\.js/)
  // Each 50 ms batch reaches the real fixed-step loop through a rendered frame.
  for (let i = 0; i < batches; i++) await page.clock.fastForward(50)
}
async function demonstration(page: Page) {
  await expect
    .poll(
      async () => {
        await advanceCombat(page, 20)
        return objective(page).innerText()
      },
      { timeout: 60000 },
    )
    .toBe('Exercice réussi')
}
async function catalog(page: Page) {
  if (await page.locator('.fight-arena').count()) await openPauseTab(page, 'Entraînement')
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
    // Four full demonstrations share the real fixed-step loop and WebGL renderer.
    test.setTimeout(240_000)
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await academy(page)
    for (const name of names) {
      await selectFighter(page, fighter)
      await school(page)
        .getByRole('button', { name: `Démontrer · ${name}`, exact: true })
        .click()
      await demonstration(page)
      await expect(page.locator('.fight-scene.failed')).toHaveCount(0)
      await openPauseTab(page, 'Entraînement')
      await expect(school(page).getByRole('status')).toHaveText('Exercice réussi !')
    }
    await school(page).getByRole('button', { name: 'Terminer l’exercice', exact: true }).click()
    await expect(page.locator('.response-diagnostics')).toBeVisible()
    expect(errors).toEqual([])
  })
}

test('manual practice rejects a different starter, resets cleanly and pauses the demonstration', async ({
  page,
}) => {
  await academy(page)
  await selectFighter(page, 'kurapika')
  await school(page)
    .getByRole('button', { name: `Pratiquer · ${names[0]}`, exact: true })
    .click()
  await advanceCombat(page, 1)
  await page.keyboard.press('k')
  await advanceCombat(page, 20)
  await openPauseTab(page, 'Entraînement')
  await expect(school(page).getByRole('status')).toContainText('ne correspond pas')
  await school(page).getByRole('button', { name: 'Réessayer l’exercice', exact: true }).click()
  await openPauseTab(page, 'Entraînement')
  await expect(school(page).getByRole('status')).toContainText('Commence la route')
  await school(page).getByRole('button', { name: 'Voir la démonstration', exact: true }).click()
  await openPauseTab(page, 'Entraînement')
  await expect(page.getByRole('button', { name: 'Reprendre le combat' })).toBeVisible()
  const frozen = await school(page).locator('.active-exercise > span').innerText()
  await page.clock.fastForward(500)
  await expect(school(page).locator('.active-exercise > span')).toHaveText(frozen)
  await resumeFight(page)
  await demonstration(page)
  await openPauseTab(page, 'Entraînement')
  await school(page).getByRole('button', { name: 'Terminer l’exercice', exact: true }).click()
  await page.getByLabel('Mannequin', { exact: true }).selectOption('random-guard')
  await expect(page.getByLabel('Mannequin', { exact: true })).toHaveValue('random-guard')
})

async function localFight(page: Page) {
  await prepareFight(page)
  await startPreparedFight(page)
  await openPauseTab(page, 'Affichage & son')
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
  const box = await page.locator('.pause-display').boundingBox()
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
  await academy(page)
  await selectFighter(page, 'kurapika')
  await school(page)
    .getByRole('button', { name: 'Défense · bloquer puis punir', exact: true })
    .click()
  await openPauseTab(page, 'Entraînement')
  const key = CONTROL_KEYS.playerGuard === ' ' ? 'Space' : CONTROL_KEYS.playerGuard
  await resumeFight(page)
  await page.keyboard.down(key)
  // Advance past the dummy's attack and the punish window while holding guard.
  await advanceCombat(page, 40)
  await page.keyboard.up(key)
  await openPauseTab(page, 'Entraînement')
  await expect(school(page).getByRole('status')).toContainText(
    'L’ouverture de punition est passée.',
  )
  await expect(school(page).locator('.active-exercise > span')).toHaveText('1 / 2')
})
