import { expect, test, type Page } from 'playwright/test'
import { prepareFight, openPauseTab, resumeFight } from './helpers/fighting'

async function launch(page: Page, mode = 'Versus local') {
  await prepareFight(page, mode)
  await page.locator('.ready-overlay button').click()
  await page.locator('.fight-arena').click({ position: { x: 12, y: 180 } })
}
async function clip(page: Page) {
  await page.keyboard.down('d')
  await page.waitForTimeout(250)
  await page.keyboard.up('d')
  await page.keyboard.press('j')
  await page.waitForTimeout(350)
  await page.keyboard.press('p')
  await expect(page.locator('.pause-overlay')).toBeVisible()
  await openPauseTab(page, 'Replays')
  await page.getByRole('button', { name: 'Enregistrer l’extrait', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Lire ce replay', exact: true })).toBeVisible()
}

test('clip survives reload, replays with verified states and restores the paused match', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await launch(page)
  await clip(page)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exporter', exact: true }).click()
  expect((await download).suggestedFilename()).toMatch(/\.bw-replay\.json$/)
  await page.getByRole('button', { name: 'Lire ce replay', exact: true }).click()
  await expect(page.locator('.battle-replay-label')).toBeVisible()
  await page.keyboard.press('l')
  await expect(page.locator('.battle-replay-label')).toContainText('Terminé', { timeout: 15000 })
  await openPauseTab(page, 'Replays')
  await expect(page.getByText('Fin du replay · états vérifiés.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Quitter le replay', exact: true }).click()
  await expect(page.locator('.pause-overlay')).toBeVisible()
  await page.goto('/fr/fighting/replays', { waitUntil: 'networkidle' })
  await page.reload({ waitUntil: 'networkidle' })
  await expect(page.getByRole('button', { name: 'Lire ce replay', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Lire ce replay', exact: true }).click()
  await expect(page.locator('.battle-replay-label')).toContainText('Terminé', { timeout: 15000 })
  await openPauseTab(page, 'Replays')
  await expect(page.getByText('Fin du replay · états vérifiés.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Quitter le replay', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Salle des replays.', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('invalid and incompatible imports leave the game usable', async ({ page }) => {
  await page.goto('/fr/fighting/replays', { waitUntil: 'networkidle' })
  const upload = page.getByLabel('Importer un replay', { exact: true })
  await upload.setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{'),
  })
  await expect(
    page.getByText('Fichier de replay invalide ou trop volumineux.', { exact: true }),
  ).toBeVisible()
  await upload.setInputFiles({
    name: 'future.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":999}'),
  })
  await expect(
    page.getByText('Ce replay nécessite une autre version du jeu.', { exact: true }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Jouer', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Contre l’IA', exact: true })).toBeEnabled()
})

test('laboratory reports received, executed and refused commands without consuming unavailable aura', async ({
  page,
}) => {
  await launch(page, 'Entraînement')
  await page.locator('.fight-arena').click({ position: { x: 12, y: 180 } })
  await page.keyboard.press('j')
  await openPauseTab(page, 'Entraînement')
  await page.locator('.response-diagnostics summary').click()
  await expect(page.locator('.response-diagnostics ol')).toContainText('Exécutée')
  await expect(page.locator('.response-diagnostics ol')).toContainText('ms')
  await page.getByRole('button', { name: 'Reset · Centre', exact: true }).click()
  await page.getByLabel('P1 aura', { exact: true }).fill('0')
  await page.getByLabel('P1 aura', { exact: true }).press('Tab')
  await resumeFight(page)
  await page.locator('.fight-arena').click({ position: { x: 12, y: 180 } })
  await page.keyboard.press('l')
  await openPauseTab(page, 'Entraînement')
  await page.locator('.response-diagnostics summary').click()
  await expect(page.locator('.response-diagnostics ol')).toContainText('Refusée')
  await expect(page.locator('.response-diagnostics ol')).toContainText(/aura|Nen/)
})

test('replay controls stay usable at mobile width, with pause, speed and restart', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await launch(page)
  await clip(page)
  await page.getByRole('button', { name: 'Lire ce replay', exact: true }).click()
  await expect(page.locator('.battle-replay-label')).toContainText('Terminé', { timeout: 15000 })
  await openPauseTab(page, 'Replays')
  await expect(page.getByText('Fin du replay · états vérifiés.', { exact: true })).toBeVisible()
  await page.getByLabel('Vitesse', { exact: true }).selectOption('0.5')
  await page
    .getByRole('button', { name: 'Recommencer le replay', exact: true })
    .evaluate((button) => {
      ;(button as HTMLButtonElement).click()
      document.querySelector<HTMLButtonElement>('.playback-bar button')!.click()
    })
  await expect(page.locator('.playback-bar button').first()).toHaveText('Lire')
  const bounds = await page.locator('.playback-bar').boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390)
  await page.screenshot({ path: '/tmp/black-whale-replay-performance/mobile.png', fullPage: true })
})
