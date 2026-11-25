import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createFightState } from './fightState'
import { fightExpressionTarget } from './fightExpressions'
import { FIGHTING_ROSTER } from './roster'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { fightFaceRig } from './fightExpressionRig'
import { fightReplayHash } from './fightReplayHash'
import type { ArcadeFighter } from './types'
import type { FightSituation } from './fightSituationalExpressions'

const scenarios: [FightSituation, (fighter: ArcadeFighter) => ArcadeFighter][] = [
  ['vigilance', (f) => ({ ...f, blocking: true, pose: 'guard' })],
  ['fatigue', (f) => ({ ...f, auraExhausted: true, aura: 0 })],
  ['determination', (f) => ({ ...f, health: f.maxHealth * 0.2 })],
  ['charging', (f) => ({ ...f, hatsuChargeFrames: 30, nen: { ...f.nen, in: true } })],
  ['alarm', (f) => ({ ...f, chainJail: { owner: 'opponent', x: f.x, y: f.y } })],
  ['confidence', (f) => ({ ...f, nen: { ...f.nen, mode: 'ren' } })],
]
const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })

describe('situational expressions in Clash', () => {
  it.each(FIGHTING_ROSTER)(
    '$name renders six distinct reactions without mutating combat',
    ({ id }) => {
      const state = createFightState(id, 'hisoka')
      const base = state.player
      const model = buildFightFigure({ THREE, glow, fighter: base })
      const rig = fightFaceRig(model.root)!
      const poses: string[] = []
      let seconds = 1
      for (const [mode, change] of scenarios) {
        const fighter = change(base)
        const snapshot = { ...state, player: fighter }
        const hash = fightReplayHash(snapshot)
        const target = fightExpressionTarget(fighter, 0)
        expect(target.mode).toBe(mode)
        expect(Object.values(target.pose).every(Number.isFinite)).toBe(true)
        poses.push(JSON.stringify(target.pose))
        model.animate(seconds, 'idle', {
          motion: fightBodyMotion({ fighter, seconds, progress: 0 }),
        })
        expect(rig.mode).toBe(mode)
        expect(fightReplayHash(snapshot)).toBe(hash)
        seconds++
      }
      expect(new Set(poses).size).toBe(scenarios.length)
      model.animate(seconds, 'idle', {
        motion: fightBodyMotion({ fighter: base, seconds, progress: 0 }),
      })
      expect(rig.mode).toBe('concentration')
    },
  )

  it.each(scenarios)(
    'prioritises a received hit over %s, including at the same timestamp',
    (mode, change) => {
      const base = change(createFightState('hisoka', 'kurapika').player)
      const model = buildFightFigure({ THREE, glow, fighter: base })
      const draw = (fighter: ArcadeFighter) =>
        model.animate(1, 'idle', {
          motion: fightBodyMotion({ fighter, seconds: 1, progress: 0 }),
        })
      draw(base)
      expect(fightFaceRig(model.root)!.mode).toBe(mode)
      draw({ ...base, hitStun: 12, pose: 'hit' })
      const rig = fightFaceRig(model.root)!
      expect(rig.mode).toBe('pain')
      expect(rig.pose!.smile).toBe(0)
      expect(rig.pose!.effort).toBe(0)
    },
  )

  it('keeps Illumi impassive and gives Hisoka more visible assurance than Chrollo', () => {
    const illumi = createFightState('illumi', 'hisoka').player
    for (const [, change] of scenarios) {
      const pose = fightExpressionTarget(change(illumi), 0).pose
      expect(pose.eye).toBe(1)
      expect(pose.brow).toBe(0)
      expect(pose.smile).toBe(0)
      expect(pose.effort).toBe(0)
    }
    const confident = (id: 'hisoka' | 'chrollo') => {
      const fighter = createFightState(id, 'kurapika').player
      fighter.nen = { ...fighter.nen, mode: 'ren' }
      return fightExpressionTarget(fighter, 0).pose
    }
    expect(confident('hisoka').smile).toBeGreaterThan(confident('chrollo').smile)
  })

  it('uses explicit combat flags rather than interpreting a received combo as confidence', () => {
    const base = createFightState('chrollo', 'hisoka').player
    expect(fightExpressionTarget({ ...base, comboHits: 5 }, 0).mode).toBe('concentration')
    expect(fightExpressionTarget({ ...base, hatsuChargeFrames: 30 }, 0).mode).toBe('concentration')
    expect(
      fightExpressionTarget({ ...base, auraExhausted: true, hatsuChargeFrames: 20 }, 0).mode,
    ).toBe('fatigue')
    expect(fightExpressionTarget({ ...base, pose: 'guard', blockStun: 10 }, 0).mode).toBe('effort')
  })
})
