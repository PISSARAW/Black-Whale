import { describe, expect, it } from 'vitest'
import type { ArenaReplay } from './replay/types'
import { adaptOpponent, V3_OPPONENTS } from './adaptation'

function replay(types: ArenaReplay['commands'][number]['action'][]): ArenaReplay {
  return { commands: types.map((action, tick) => ({ tick, action })) } as ArenaReplay
}

describe('Arena V3 adaptive opponents', () => {
  it('counters the dominant habit across the five most recent bouts', () => {
    const history = Array.from({ length: 7 }, () => replay([{ type: 'GUARD', side: 'player' }]))
    expect(adaptOpponent(history)).toEqual({
      doctrine: 'artillery',
      pressure: 'distance',
      observedBouts: 5,
    })
  })

  it('defines bosses through rule changes rather than extra health', () => {
    const bosses = V3_OPPONENTS.filter((opponent) => opponent.bossRule)
    expect(bosses.map((boss) => boss.bossRule)).toEqual(['no-visible-intent', 'aura-tax'])
    expect(bosses.every((boss) => !('health' in boss))).toBe(true)
  })
})
