import { appendFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ROSTER_TECHNIQUES } from '../../rosterTechniqueDirection'
import { runLoopback } from './loopback'
import { longDuel, script } from './sessionFixture'
import type { FighterId } from '../../types'

// Lot L2 acceptance (docs/clash-netcode-rollback.md): 10 000 frames per fighter at 0, 100 and
// 150 ms round trip. Minutes long, so opt-in:
//   ROLLBACK_LONG=1 ROLLBACK_LONG_REPORT=/tmp/rollback-long.jsonl pnpm exec vitest run \
//     src/lib/fighting/pvp/rollback/session.long.test.ts
const ROSTER = Object.keys(ROSTER_TECHNIQUES) as FighterId[]
const ONE_WAY_MS = [0, 50, 75]
const FRAMES = 10_020

describe.runIf(process.env.ROLLBACK_LONG === '1')('rollback session, 10 000 frames', () => {
  it.each(ROSTER.map((id, index) => [id, ROSTER[(index + 7) % ROSTER.length]] as const))(
    '%s against %s',
    (player, opponent) => {
      for (const delayMs of ONE_WAY_MS) {
        const started = performance.now()
        const result = runLoopback({
          initial: longDuel(player, opponent),
          script,
          frames: FRAMES,
          link: { delayMs, jitterMs: 10, loss: 0.02, seed: delayMs * 31 + 3 },
        })
        const report = process.env.ROLLBACK_LONG_REPORT
        if (report)
          appendFileSync(
            report,
            JSON.stringify({
              player,
              opponent,
              delayMs,
              ms: performance.now() - started,
              ...result,
            }) + '\n',
          )
        expect([result.a, result.b]).toEqual([result.reference, result.reference])
        expect(result.desync).toEqual({ a: null, b: null })
      }
    },
    1_800_000,
  )
})
