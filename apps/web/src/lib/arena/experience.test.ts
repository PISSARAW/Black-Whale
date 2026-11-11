import { describe, expect, it } from 'vitest'
import { resolveArenaExperience } from './experience'
import type { ArenaReplay } from './replay/types'

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
})
