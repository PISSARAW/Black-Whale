import { expect, test } from 'playwright/test'
import { startPreparedFight } from './helpers/fighting'

test('preparation pages keep the matchup and stage through back navigation and reload', async ({
  page,
}) => {
  await page.goto('/fr/fighting', { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { name: 'À TOI DE JOUER.' })).toBeVisible()
  await expect(page.getByLabel('Liste des combattants')).toHaveCount(0)
  await expect(page.getByLabel('Choix du terrain')).toHaveCount(0)
  await page.getByRole('button', { name: 'Versus local', exact: true }).click()
  await expect(page).toHaveURL(/\/fighting\/characters$/)
  await page.getByRole('button', { name: 'Benjamin, Faction Benjamin', exact: true }).click()
  await page.getByRole('button', { name: 'Confirmer P1', exact: true }).click()
  await page.getByLabel('Rechercher un combattant', { exact: true }).fill('Chrollo')
  const chrollo = page.getByRole('button', { name: 'Chrollo, Brigade Fantôme', exact: true })
  await chrollo.click()
  await expect(chrollo).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Choisir le terrain', exact: true }).click()
  await page.getByRole('button', { name: 'Tour Céleste', exact: true }).click()
  await page.getByRole('button', { name: 'Règles du combat', exact: true }).click()
  await expect(page.getByLabel('Récapitulatif du combat')).toContainText('Benjamin')
  await expect(page.getByLabel('Récapitulatif du combat')).toContainText('Chrollo')
  await expect(page.getByLabel('Récapitulatif du combat')).toContainText('Tour Céleste')
  await page.getByRole('link', { name: '← Retour', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Tour Céleste', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.reload({ waitUntil: 'networkidle' })
  await expect(page.getByRole('button', { name: 'Tour Céleste', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: 'Règles du combat', exact: true }).click()
  await page.getByRole('button', { name: 'Entrer dans l’arène', exact: true }).click()
  await expect(page).toHaveURL(/\/fighting\/battle$/)
  await startPreparedFight(page)
  const hud = page.locator('.fight-arena .hud')
  await expect(hud).toContainText('Benjamin')
  await expect(hud).toContainText('Chrollo')
})

test('a directly opened battle page returns to usable setup', async ({ page }) => {
  await page.goto('/fr/fighting/battle', { waitUntil: 'networkidle' })
  await expect(page).toHaveURL(/\/fighting\/options$/)
  await expect(page.getByRole('button', { name: 'Entrer dans l’arène', exact: true })).toBeEnabled()
})
