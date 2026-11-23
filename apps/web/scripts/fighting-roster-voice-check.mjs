import assert from 'node:assert/strict'

export async function verifyRosterVoiceWaves(page, waves) {
  const cast = waves.flatMap((wave) => Object.keys(wave))
  for (const locale of ['fr', 'en']) {
    await page.evaluate((code) => window.audioFixture.setLocale(code), locale)
    for (let index = 0; index < cast.length; index += 2) {
      const pair = cast.slice(index, index + 2)
      const duel = [pair[0], pair[1] ?? cast[0]]
      await page.evaluate((fighters) => window.audioFixture.setCastDuel(fighters), duel)
      const keys = pair.map((fighter) => `${locale}-${fighter}`)
      await page.waitForFunction(
        (banks) => banks.every((key) => window.rosterVoiceBanks.has(key)),
        keys,
      )
      const played = await page.evaluate(async () => {
        window.voiceStarts.length = 0
        await window.audioFixture.playCastEfforts()
        return window.voiceStarts
      })
      for (const [side, fighter] of pair.entries()) {
        const bank = waves[Math.floor((index + side) / 5)][fighter][locale]
        const effort = played.find((clip) => clip.rosterBank === keys[side])
        assert.ok(effort, `${keys[side]} played its own combat voice`)
        assert.ok(
          ['effort-0', 'effort-1', 'effort-2'].some((key) => {
            const [offset, length] = bank[key]
            return (
              Math.abs(effort.offset * 24000 - offset) < 0.2 &&
              Math.abs(effort.duration * 24000 - length) < 0.2
            )
          }),
          `${keys[side]} played an authored effort`,
        )
      }
    }
  }
  process.stdout.write(
    `${waves.length} roster waves: ${cast.length} fighters played their own efforts in FR and EN.\n`,
  )
}
