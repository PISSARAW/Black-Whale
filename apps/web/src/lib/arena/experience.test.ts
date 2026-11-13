import { describe, expect, it } from 'vitest'
import { resolveArenaExperience } from './experience'
import type { ArenaReplay } from './replay/types'
import { ARENA_CAMPAIGN } from './campaign'

const replay = (action: ArenaReplay['commands'][number]['action']): ArenaReplay =>
  ({ commands: [{ tick: 1, action }] }) as ArenaReplay

describe('Arena experience', () => {
  it('connects named opponents to their doctrine and difficulty', () => {
    expect(
      resolveArenaExperience({ formatId: 'sudden-death', opponentId: 'silent-gunner' }),
    ).toMatchObject({
      format: { id: 'sudden-death', scoreToWin: 1 },
      doctrine: 'artillery',
      difficulty: 'master',
    })
  })

  it('uses recent bouts for the adaptive opponent', () => {
    const history = Array.from({ length: 4 }, () => replay({ type: 'GUARD', side: 'player' }))
    expect(
      resolveArenaExperience({ formatId: 'survival', opponentId: 'adaptive', history }),
    ).toMatchObject({
      doctrine: 'artillery',
      difficulty: 'master',
      observedBouts: 4,
    })
  })

  it('keeps every authored campaign match ahead of opponent defaults', () => {
    for (const mission of ARENA_CAMPAIGN) {
      expect(
        resolveArenaExperience({
          formatId: mission.formatId,
          opponentId: mission.opponentId,
          matchPreset: mission,
        }),
      ).toMatchObject({
        opponentId: mission.opponentId,
        doctrine: mission.doctrine,
        difficulty: mission.difficulty,
      })
    }
  })
})
