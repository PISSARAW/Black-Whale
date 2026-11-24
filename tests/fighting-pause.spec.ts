import { expect, test, type Page } from 'playwright/test'
import { prepareFight, openPauseTab, resumeFight } from './helpers/fighting'

const stats = (page: Page) =>
  page.locator('.hud').evaluate((element) => ({
    time: element.querySelector('.timer')!.textContent,
    values: [...element.querySelectorAll('[role="meter"]')].map((node) =>
      node.getAttribute('aria-valuenow'),
    ),
  }))

test('the match stays minimal, and the native pause menu freezes time, resources and inputs', async ({
  page,
}) => {
  await prepareFight(page)
  await page.locator('.ready-overlay button').click()
  await expect(page.locator('.fighter-resources, .fight-toolbar, .fight-manual')).toHaveCount(0)
  await expect(page.locator('.app-header')).not.toBeVisible()
  await expect(page.locator('.aura')).toHaveCount(2)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'PAUSE', exact: true })).toBeVisible()
  const frozen = await stats(page)
  await page.keyboard.press('j')
  await openPauseTab(page, 'Techniques & états')
  await expect(page.getByRole('button', { name: 'Reprendre le combat', exact: true })).toBeVisible()
  await page.waitForTimeout(350)
  expect(await stats(page)).toEqual(frozen)
  await page.keyboard.press('Escape')
  await expect(page.locator('.clash-pause-menu')).toHaveCount(0)
  await page.keyboard.press('p')
  await expect(page.locator('.clash-pause-menu')).toBeVisible()
})

test('controls, audio and display settings are readable inside the mobile pause menu', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await prepareFight(page)
  await page.locator('.ready-overlay button').click()
  await openPauseTab(page, 'Commandes')
  const bounds = await page.locator('.clash-pause-menu').boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390)
  await expect(page.getByRole('region', { name: 'Configuration des commandes' })).toBeVisible()
  await openPauseTab(page, 'Affichage & son')
  await expect(page.getByLabel('Commandes tactiles', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Impacts et garde', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Techniques et Nen', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Cinématiques', { exact: true })).toBeVisible()
  await resumeFight(page)
  await expect(page.locator('.clash-pause-menu')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})
