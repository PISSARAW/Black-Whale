import { expect, it } from 'vitest'
import { createFightState } from './fightState'
import { performAttack } from './engine'
import { FIGHTING_ROSTER } from './roster'
import { attackData } from './frameData'
import { strikeSilhouette } from './fightStrikeSilhouette'
import { strikePresentationFrame } from './fightStrikeRhythm'

it.each(FIGHTING_ROSTER.map((f) => f.id))(
  '%s has distinct preparation, contact and release inside its existing timing',
  (id) => {
    const fighter = performAttack(
      { ...createFightState(id, 'hisoka'), phase: 'fighting' },
      'player',
      'heavy',
    ).player
    const frames = attackData('heavy', fighter)
    const at = (frame: number) => strikeSilhouette(fighter, { frames, frame })
    const load = at(frames.startup * 0.5),
      contact = at(frames.startup)
    expect(load).not.toEqual(contact)
    expect(at(frames.startup + frames.active * 0.5)).toEqual(contact)
    expect(
      Object.values(at(frames.startup + frames.active + frames.recovery))
        .flat()
        .every((v) => Math.abs(v) < 1e-6),
    ).toBe(true)
    const hit = { ...fighter, attack: { ...fighter.attack!, confirmedHit: true } }
    const start = frames.startup + frames.active
    expect(strikePresentationFrame(hit, frames, start + 1)).toBe(start)
    expect(strikePresentationFrame(hit, frames, start + frames.recovery)).toBe(
      start + frames.recovery,
    )
    expect(strikePresentationFrame(fighter, frames, start + 1)).toBeGreaterThan(start)
  },
)
