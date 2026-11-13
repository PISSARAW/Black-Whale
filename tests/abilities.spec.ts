import { expect, test } from 'playwright/test'

test.describe('the ability catalogue', () => {
  test('filters, explains and previews a canonical use', async ({ page, isMobile }) => {
    const response = await page.goto('/abilities')
    expect(response?.status()).toBeLessThan(400)

    const search = page.getByRole('searchbox', { name: 'Search an ability, owner, or rule' })
    const category = page.getByRole('combobox', { name: 'All categories' })
    const owner = page.getByRole('combobox', { name: 'All owners' })

    await search.fill('Bungee Gum')
    const card = page.locator('article[data-hatsu-id="bungee-gum"]')
    await expect(card).toBeVisible()
    await expect(page.locator('.result-count')).toHaveText(/\d+ abilities?/)

    const categoryValue = await card.locator('.category').textContent()
    const ownerValue = await card.locator('.owner').textContent()
    await search.fill('')
    await category.selectOption({ label: categoryValue!.trim() })
    await owner.selectOption({ label: ownerValue!.trim() })
    await search.fill('rubber')
    await expect(card).toBeVisible()
    await expect(page.locator('.result-count')).toHaveText('1 ability')

    await card.locator('summary').click()
    const wheel = card.getByRole('list', { name: 'Hatsu uses' })
    await expect(wheel).toBeVisible()
    await expect(card.locator('[data-component-key="BungeeGumInteraction"]')).toBeVisible()
    await expect(card.getByText(/^Cost:/)).toBeVisible()

    const refusal = wheel.locator('button[data-action-id="attach-to-aura"]')
    await expect(refusal).toHaveAttribute('aria-disabled', 'true')
    if (isMobile) await refusal.tap({ force: true })
    else {
      await refusal.focus()
      await refusal.press('Enter')
    }
    await expect(refusal).toHaveClass(/current/)
    await expect(card.locator('.why[data-status="LOCKED"]')).toBeVisible()
    await expect(refusal.locator('small').last()).not.toBeEmpty()

    await expect(card.getByRole('link', { name: /Try in the tour/ })).toHaveAttribute(
      'href',
      /\/tour\?hatsu=bungee-gum$/,
    )
  })

  test('routes Contagion to the Morena encounter with source chapters', async ({ page }) => {
    await page.goto('/abilities')
    await page
      .getByRole('searchbox', { name: 'Search an ability, owner, or rule' })
      .fill('Contagion')

    const card = page.locator('article[data-hatsu-id="contagion"]')
    await expect(card).toBeVisible()
    await expect(card.getByText('Source chapters')).toBeVisible()
    await expect(card.getByText(/ch\. 408/)).toBeVisible()
    await expect(card.getByRole('link', { name: /Try in the tour/ })).toHaveAttribute(
      'href',
      /\/tour\/morena$/,
    )
  })
})
