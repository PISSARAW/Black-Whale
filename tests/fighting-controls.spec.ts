import { expect, test, type Page } from 'playwright/test'
import { prepareFight, openPauseTab, resumeFight } from './helpers/fighting'

function fakePad(index: number) {
  return {
    index,
    id: `Test Pad ${index}`,
    connected: true,
    mapping: 'standard',
    axes: [0, 0],
    buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
  }
}
type TestPad = ReturnType<typeof fakePad>
declare global {
  interface Window {
    fightTestPads: Array<TestPad | null>
  }
}

async function localFight(page: Page) {
  await prepareFight(page)
}
async function pressPad(page: Page, side: number, pressed: number[]) {
  await page.evaluate(
    ({ side, pressed }) => {
      window.fightTestPads[side]!.buttons.forEach((button, index) => {
        button.pressed = pressed.includes(index)
        button.value = Number(button.pressed)
      })
    },
    { side, pressed },
  )
}
async function neutralPad(page: Page, side: number) {
  await pressPad(page, side, [])
  // Polling must observe a neutral frame before another physical edge.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  )
}

test('two local gamepads support Nen, disconnection and pause/resume', async ({ page }) => {
  await page.addInitScript(() => {
    window.fightTestPads = []
    Object.defineProperty(navigator, 'getGamepads', { value: () => window.fightTestPads })
  })
  await localFight(page)
  await page.evaluate(
    (pads) => {
      window.fightTestPads = pads
    },
    [fakePad(0), fakePad(1)],
  )
  await neutralPad(page, 0)
  await pressPad(page, 0, [9])
  await expect(page.locator('.ready-overlay')).toHaveCount(0)
  await neutralPad(page, 0)
  await pressPad(page, 0, [5])
  await expect(page.locator('.hud .nen-status').first()).toContainText('ren', { ignoreCase: true })
  await pressPad(page, 1, [4, 5])
  await expect
    .poll(async () => Number(await page.locator('.aura').nth(1).getAttribute('aria-valuenow')))
    .toBeLessThan(55)
  await page.evaluate(() => {
    window.fightTestPads[0] = null
  })
  await expect(page.locator('.hud .nen-status').first()).toContainText('ten', { ignoreCase: true })
  await neutralPad(page, 1)
  await pressPad(page, 1, [9])
  await expect(page.locator('.pause-overlay')).toBeVisible()
  await neutralPad(page, 1)
  await pressPad(page, 1, [9])
  await expect(page.locator('.pause-overlay')).toHaveCount(0)
})

test('remapped keyboard controls persist and drive the fight after leaving settings', async ({
  page,
}) => {
  await localFight(page)
  await page.locator('.ready-overlay button').click()
  await openPauseTab(page, 'Commandes')
  await expect(page.locator('.pause-overlay')).toBeVisible()
  await page.getByRole('button', { name: 'Espace', exact: true }).click()
  await page.keyboard.press('Backquote')
  await expect(page.getByRole('button', { name: '`', exact: true })).toBeVisible()
  await resumeFight(page)
  await page.locator('.fight-arena').click({ position: { x: 10, y: 200 } })
  await page.keyboard.down('Backquote')
  await expect(page.locator('.hud .nen-status').first()).toContainText('ren', { ignoreCase: true })
  await page.keyboard.up('Backquote')
  await expect(page.locator('.hud .nen-status').first()).toContainText('ten', { ignoreCase: true })
  await localFight(page)
  await openPauseTab(page, 'Commandes')
  await expect(page.getByRole('button', { name: '`', exact: true })).toBeVisible()
})

test('control settings stay readable on a narrow screen and close with Escape', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await localFight(page)
  await page.locator('.ready-overlay button').click()
  await openPauseTab(page, 'Commandes')
  const panel = page.locator('.input-settings section')
  await expect(panel).toBeVisible()
  const bounds = await panel.boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390)
  await page.getByRole('button', { name: 'P1', exact: true }).focus()
  await page.keyboard.press('Escape')
  await expect(page.locator('.clash-pause-menu')).toHaveCount(0)
})
