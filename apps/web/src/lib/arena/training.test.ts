import { describe, expect, it } from 'vitest'
import { initialCombatState, type CombatAction, type CombatEvent } from '../combat/types'
import { moveForSlot } from '../fighting/movesets'
import { advanceArenaLesson, arenaFrameReadout, arenaTrainingFeedback } from './training'

describe('Arena Clash training', () => {
  it('reads frame data from the authored move without approximating dynamic advantage', () => {
    const move = moveForSlot('kurapika', 'standingLight')!
    const jab = arenaFrameReadout(move, 'fr')
    const hatsu = arenaFrameReadout(moveForSlot('kurapika', 'neutralSpecial')!, 'fr')

    expect(jab).toMatchObject({
      startup: move.tuning.startup,
      active: move.tuning.active,
      recovery: move.tuning.recovery,
      onHit: '+3',
    })
    expect(jab.safeOnBlock).toBe(true)
    expect(hatsu.onHit).toBe('—')
    expect(hatsu.safeOnBlock).toBeNull()
  })

  it('teaches a real authored confirm, combo and block instead of button presses alone', () => {
    const base = initialCombatState()
    const action = { type: 'TICK', dt: 1 / 60 } satisfies CombatAction
    const hit = event({ attacker: 'player', impact: 'clean' })
    const confirmed = { ...base, lastEvent: hit }
    expect(advanceArenaLesson({ lesson: 3, action, before: base, after: confirmed })).toBe(4)

    const chained = {
      ...confirmed,
      player: {
        ...confirmed.player,
        chain: {
          moveId: hit.moveId!,
          connected: 'hit' as const,
          until: 1,
          history: ['a', 'b'],
          points: 1,
        },
      },
    }
    expect(advanceArenaLesson({ lesson: 4, action, before: confirmed, after: chained })).toBe(5)

    const blocked = { ...chained, lastEvent: event({ attacker: 'opponent', impact: 'blocked' }) }
    expect(advanceArenaLesson({ lesson: 5, action, before: chained, after: blocked })).toBe(6)
  })

  it('identifies an unsafe blocked move as a POV punish lesson', () => {
    const move = moveForSlot('kurapika', 'standingHeavy')!
    const feedback = arenaTrainingFeedback(
      event({ attacker: 'opponent', impact: 'blocked', moveId: move.id }),
      'en',
    )

    expect(feedback?.tone).toBe('punish')
    expect(feedback?.lesson).toContain('Punish available')
  })
})

function event(overrides: Partial<CombatEvent>): CombatEvent {
  return {
    at: 0,
    attacker: 'player',
    zone: 'torso',
    impact: 'clean',
    points: 1,
    technique: 'strike',
    moveId: 'kurapika:standingLight',
    ...overrides,
  }
}
