import { expect, type Page } from 'playwright/test'

export async function prepareFight(page: Page, mode = 'Versus local') {
  await page.goto('/fr/fighting', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: mode, exact: true }).click()
  await page.getByRole('button', { name: 'Confirmer P1', exact: true }).click()
  await page.getByRole('button', { name: 'Choisir le terrain', exact: true }).click()
  await page.getByRole('button', { name: 'Règles du combat', exact: true }).click()
  await page.getByRole('button', { name: 'Entrer dans l’arène', exact: true }).click()
  await expect(page.locator('.ready-overlay')).toBeVisible()
}

export async function openPauseTab(page: Page, label: string) {
  if (!(await page.locator('.clash-pause-menu[open]').isVisible()))
    await page.getByRole('button', { name: 'Ouvrir le menu pause', exact: true }).click()
  await page.getByRole('button', { name: new RegExp(`^(?:0\\d )?${label}$`) }).click()
}

export async function resumeFight(page: Page) {
  await page.getByRole('button', { name: 'Reprendre le combat', exact: true }).click()
}
