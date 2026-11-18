import { expect, it } from 'vitest'
import { createFightState } from './fightState'
import { performAttack } from './engine'
import { strikePresentationFrame } from './fightStrikeRhythm'
import { attackData } from './frameData'
import { FIGHTING_ROSTER } from './roster'

it.each(FIGHTING_ROSTER.map((f) => f.id))(
  '%s preserves contact and total duration with a continuous follow-through',
  (id) => {
    const state = performAttack(
      { ...createFightState(id, 'hisoka'), phase: 'fighting' },
      'player',
      'heavy',
    )
    const frames = attackData('heavy', state.player)
    const start = frames.startup + frames.active
    for (let frame = 0; frame <= start; frame++)
      expect(strikePresentationFrame(state.player, frames, frame)).toBe(frame)
    expect(strikePresentationFrame(state.player, frames, start + frames.recovery)).toBe(
      start + frames.recovery,
    )
    let prior = start
    for (let n = 1; n <= frames.recovery; n++) {
      const next = strikePresentationFrame(state.player, frames, start + n)
      expect(next).toBeGreaterThan(prior)
      expect(next - prior).toBeLessThan(1.5)
      prior = next
    }
  },
)
