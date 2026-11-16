import { Group } from 'three'
import { describe, expect, it } from 'vitest'
import { ceremonyText, victoryMotion, winnerForCeremony } from './presentation'
import { createFight } from '../engine'
import { FIGHTING_ROSTER } from '../roster'
import { fightReplayHash } from '../fightReplayHash'
import type { AnimatedHuman } from '../../tour/humanAnimation'

function rig(): AnimatedHuman {
  return {
    pose: 'idle',
    figure: new Group(),
    torso: new Group(),
    pelvis: new Group(),
    head: new Group(),
    arms: [new Group(), new Group()],
    legs: [new Group(), new Group()],
    knees: [new Group(), new Group()],
  }
}
describe('cosmetic ceremonies preserve Nen and combat', () => {
  it.each(FIGHTING_ROSTER)(
    'has an original bilingual introduction for $id without reading private Hatsu data',
    ({ id }) => {
      const state = createFight(id, 'hisoka')
      const text = ceremonyText(state, 'fr', 'player'),
        hash = fightReplayHash(state)
      expect(text.length).toBeGreaterThan(0)
      expect(ceremonyText(state, 'en', 'player').length).toBeGreaterThan(0)
      expect(fightReplayHash(state)).toBe(hash)
      state.opponent.secretWindow = {
        target: 'player',
        attachedAt: 1,
        observation: { frame: 1, action: 'special' },
      }
      expect(ceremonyText(state, 'fr', 'player')).toBe(text)
    },
  )
  it('changes only the rendered rig after a verdict, and never overrides post-mortem or an occupied body', () => {
    const state = {
      ...createFight('hisoka', 'camilla'),
      phase: 'finished' as const,
      winner: 'player' as const,
    }
    const hash = fightReplayHash(state),
      posed = rig()
    victoryMotion({ state, side: 'player', victory: 'salute', seconds: 0, fallback: () => {} })(
      posed,
    )
    expect(posed.arms[1].rotation.x).toBe(-1.65)
    expect(fightReplayHash(state)).toBe(hash)
    state.catsName = { victimSide: 'opponent', killerSide: 'player', frame: 1 }
    expect(winnerForCeremony(state)).toBeNull()
    const held = rig()
    victoryMotion({ state, side: 'player', victory: 'salute', seconds: 0, fallback: () => {} })(
      held,
    )
    expect(held.arms[1].rotation.x).toBe(0)
    state.catsName = undefined
    state.player.pluggingWounds = true
    victoryMotion({ state, side: 'player', victory: 'ready', seconds: 0, fallback: () => {} })(held)
    expect(held.arms[1].rotation.x).toBe(0)
  })
  it('does not apply a winner pose in combat, on the defeated body, or with the still option', () => {
    const state = createFight('hisoka', 'camilla')
    for (const victory of ['ready', 'salute', 'still'] as const) {
      const posed = rig()
      victoryMotion({
        state,
        side: 'player',
        victory,
        seconds: 0,
        fallback: () => {
          posed.head.rotation.y = 1
        },
      })(posed)
      expect(posed.arms[0].rotation.x).toBe(0)
      expect(posed.head.rotation.y).toBe(1)
    }
  })
})
