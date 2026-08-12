import { expect, test } from 'playwright/test'

/**
 * The walk, exercised on both projects.
 *
 * `pnpm test` runs no WebGL at all: the mesh, the visibility set and the dust
 * are tested as arrays, which is what makes them testable, and the consequence
 * is that nothing under `vitest` can tell whether the deck ever reached a
 * screen. Everything below is a load path a unit test cannot reach — the
 * composer building its chain of passes, the comfort settings surviving a
 * reload, the evidence card coming back from a real click on a real canvas.
 *
 * Deliberately not a pixel comparison. The tour's picture is a stack of
 * post-processing passes over a GPU the runner does not have, so a reference
 * capture would be a test of the CI machine's driver. What is asserted here is
 * that the walk *works*: it boots, it takes input, it answers with evidence,
 * and the visitor's settings are theirs.
 */

const ready = async (page: import('playwright/test').Page) => {
  const canvas = page.locator('canvas').first()
  await expect(canvas).toBeAttached({ timeout: 30_000 })
  // Attached is not sized: the scene is built after a dynamic import of
  // three.js, and the renderer only takes the container's size once it exists.
  await expect
    .poll(async () => canvas.evaluate((node) => (node as HTMLCanvasElement).width), {
      timeout: 30_000,
    })
    .toBeGreaterThan(0)
  return canvas
}

test.describe('the walk', () => {
  test('boots the deck and says where the visitor is', async ({ page }) => {
    const response = await page.goto('/tour')
    expect(response?.status()).toBeLessThan(400)
    await ready(page)
    // The location read-out is written from the blueprint, so a deck that
    // reached the screen is a deck that named itself.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('hands over the evidence for what is in front of you', async ({ page }) => {
    await page.goto('/tour')
    await ready(page)

    // The prompt is a button rather than only a key, because a phone has no
    // keyboard — so this is the same gesture on both projects.
    const ask = page.getByRole('button', { name: /Examine|Examiner/ })
    await expect(ask).toBeVisible({ timeout: 30_000 })
    // Centred rather than merely scrolled into view: the page's own header is
    // sticky, and Playwright's default lands the button underneath it.
    await ask.evaluate((node) => node.scrollIntoView({ block: 'center' }))
    await ask.click()

    const card = page.getByRole('complementary', { name: /Evidence|Pièce à conviction/ })
    await expect(card).toBeVisible()
    // The card is evidence, so it must carry the two things evidence carries:
    // what this asserts, and where it comes from.
    // Standing in a room, the answer is that room's chapter; the one place the
    // walk may answer with nothing is out in the hull between two footprints,
    // and even there it says so rather than going quiet.
    await expect(
      card.getByText(
        /What this asserts|Ce que cela affirme|Nothing in front of you|Rien devant vous/,
      ),
    ).toBeVisible()

    await card.getByRole('button', { name: /Put it back|Reposer/ }).click()
    await expect(card).toBeHidden()
  })

  /**
   * ADR-003 gave the walk a server load. What is asserted here is the promise
   * that came with it: the ship is a reconstruction before it is a cast list,
   * so an event the archive cannot answer for is an empty ship rather than a
   * failed page — every corridor still walkable, every technique still castable,
   * and nobody in them.
   */
  test('boots empty rather than failing when the archive answers with nobody', async ({ page }) => {
    const response = await page.goto('/tour?eventId=no-such-event')
    expect(response?.status()).toBeLessThan(400)
    await ready(page)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  /**
   * The frame budget, which is the one thing here that can only be checked in a
   * browser: `renderer.info` is a count of what three.js actually issued, so it
   * does not exist until something has been drawn.
   *
   * What is asserted is the instrument, not a number. The runner draws on
   * SwiftShader, so its frame rate is a fact about a software rasteriser and
   * asserting on it would be the same mistake as a reference capture. The
   * triangle and draw-call counts, though, are the GPU's only in the sense that
   * it received them — they are decided by the mesh and by `visibility.ts`, so
   * a count of zero on a booted deck is a real break wherever it is run.
   */
  test('measures the frame only when asked, and counts what was drawn', async ({ page }) => {
    await page.goto('/tour')
    await ready(page)
    // Off by default, in every build: the walk pays nothing for an instrument
    // nobody switched on.
    await expect(page.locator('#tour-frame-budget')).toHaveCount(0)

    await page.goto('/tour?frames')
    await ready(page)
    const meter = page.locator('#tour-frame-budget')
    // A window is half a second of frames, and the deck has to build first.
    await expect(meter).toBeVisible({ timeout: 30_000 })
    await expect(meter).toContainText(/img\/s/)

    // The counters have to be the whole frame and not its last draw call — the
    // reason `meteredFrame` turns `info.autoReset` off. A deck that reached the
    // screen drew triangles.
    // Parsed rather than pattern-matched: `Intl` groups thousands with a narrow
    // no-break space, and a regex written against an ordinary one would pass on
    // a broken "0 tri" and fail on a healthy "41 203 tri".
    const readout = (await meter.textContent()) ?? ''
    const drawn = /([\d\s\u202f\u00a0]+)tri/.exec(readout)?.[1] ?? ''
    expect(Number(drawn.replace(/\D/g, ''))).toBeGreaterThan(0)
  })

  test('lets the visitor set the palier, and keeps it across a reload', async ({ page }) => {
    await page.goto('/tour')
    await ready(page)

    const lighter = page.getByRole('button', { name: /^(Lighter|Allégée)$/ })
    await expect(lighter).toBeVisible({ timeout: 30_000 })
    await lighter.click()
    await expect(lighter).toHaveAttribute('aria-pressed', 'true')

    // The whole argument for the setting existing: a detection cannot know that
    // this machine throttles, and being made to say so on every visit is the
    // same as not being able to say it.
    await page.reload()
    await expect(page.getByRole('button', { name: /^(Lighter|Allégée)$/ })).toHaveAttribute(
      'aria-pressed',
      'true',
      { timeout: 30_000 },
    )
  })
})
