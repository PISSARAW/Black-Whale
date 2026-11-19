import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { kallutoAiSlots } from './kallutoAi'
import { paperState, selectPaperTarget } from './kallutoPaper'
import { nenTacticalIntent } from './nenTacticalIntent'
import { createKallutoPaperScene } from './kallutoScene'
import { launchKallutoPaper } from './kallutoFlight'
import { paperRibbonFragment } from './kallutoPaperRibbon'
import { bodyPlan } from './fightBodyMotion'
import { attackData } from './frameData'
import { EMPTY_INPUT, type FightState } from './types'

function duel(): FightState {
  const s = beginFight(createFight('hisoka', 'kalluto', { mode: 'versus-local' }))
  return { ...s, player: { ...s.player, x: 30 }, opponent: { ...s.opponent, x: 50, aura: 100 } }
}
function tick(state: FightState, frames: number) {
  for (let i = 0; i < frames; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function followPlan(state: FightState): FightState {
  const slot = kallutoAiSlots({ state, gap: 20, roll: 0.75 })[0]
  return tick(
    performAuraAttack({
      state,
      side: 'opponent',
      kind: 'special',
      moveId: `kalluto:${slot}`,
      auraCharged: false,
    }),
    60,
  )
}

describe('Kalluto · episode 96 reference', () => {
  it.each(['head', 'torso', 'hands', 'feet'] as const)(
    'AI marks the selected %s, then cuts it without first making a doll',
    (zone) => {
      let s = selectPaperTarget(duel(), 'opponent', zone)
      s = followPlan(s)
      expect(s.player.plantedPaper).toContainEqual({ owner: 'opponent', zone })
      expect(paperState(s.opponent).doll).toBeUndefined()
      expect(kallutoAiSlots({ state: s, gap: 20, roll: 0.5 })[0]).toBe('forwardSpecial')
      const health = s.player.health
      s = followPlan(s)
      expect(s.player.health).toBeLessThan(health)
      expect(s.player.openWounds).toBeGreaterThan(0)
      expect(s.impact?.zone).toBe(zone)
      expect(s.phase).toBe('fighting')
    },
  )
  it('uses short fan cuts under close pressure and preserves aura recovery planning', () => {
    const s = duel()
    expect(kallutoAiSlots({ state: s, gap: 5, roll: 0.5 })[0]).toBe('standingLight')
    s.opponent.aura = 5
    expect(nenTacticalIntent(s, 'opponent').goal).toBe('recover')
    expect(nenTacticalIntent(s, 'opponent').slots).toContain('neutralSpecial')
  })
  it('reserves the doll for an occasional distant opening', () => {
    const s = duel()
    s.player.plantedPaper = [{ owner: 'opponent', zone: 'torso' }]
    expect(kallutoAiSlots({ state: s, gap: 24, roll: 0.95 })[0]).toBe('backSpecial')
    s.opponent.kallutoPaper = { zone: 'torso', doll: { target: 'player', createdAt: 0 } }
    expect(kallutoAiSlots({ state: s, gap: 24, roll: 0.95 })[0]).toBe('forwardSpecial')
  })
  it('keeps the fan gesture on the anatomical right arm in both orientations', () => {
    const s = performAuraAttack({
      state: duel(),
      side: 'opponent',
      kind: 'special',
      moveId: 'kalluto:neutralSpecial',
      auraCharged: false,
    })
    const fighter = s.opponent
    const frame = attackData('special', fighter).startup
    const posed = { ...fighter, attack: { ...fighter.attack!, frame } }
    const right = bodyPlan({ ...posed, facing: 1 }, { seconds: 1, progress: 0 })!.pose
    const left = bodyPlan({ ...posed, facing: -1 }, { seconds: 1, progress: 0 })!.pose
    expect(right.leadShoulder![0]).toBeLessThan(-0.8)
    expect(left.rearShoulder).toEqual(right.leadShoulder)
    expect(left.rearWrist).toEqual(right.leadWrist)
    const guiding = bodyPlan(
      { ...posed, facing: 1, attack: { ...posed.attack, frame: frame + 8 } },
      { seconds: 1.2, progress: 0 },
    )!.pose
    expect(guiding.leadShoulder![0]).toBeLessThan(-0.8)
  })
  it('draws the tip at the real projectile and the helix behind it, including reduced motion', () => {
    const shot = { ...launchKallutoPaper(duel(), 'opponent', 'serpent').projectiles[0], age: 20 }
    for (const reduced of [false, true]) {
      for (const x of [-1, 1]) {
        const tip = paperRibbonFragment({ shot, index: 0, reduced, direction: { x, y: 0 } })
        const tail = paperRibbonFragment({ shot, index: 47, reduced, direction: { x, y: 0 } })
        expect(Math.abs(tip.x) + Math.abs(tip.y) + Math.abs(tip.z)).toBe(0)
        expect(tail.x * x).toBeLessThan(0)
        expect(Object.values(tail).every(Number.isFinite)).toBe(true)
      }
    }
  })
  it('reconstructs the same visual frame after rewind and removes expired paper', () => {
    const scene = new THREE.Scene()
    const effect = createKallutoPaperScene({ THREE, scene, worldX: (x) => x, worldY: (y) => y })
    const s = launchKallutoPaper(duel(), 'opponent', 'serpent')
    effect.sync(s, 0)
    const group = scene.getObjectByName('kalluto-paper')!
    const positions = () => group.children.map((mesh) => mesh.position.toArray())
    const before = positions()
    effect.sync({ ...s, projectiles: s.projectiles.map((shot) => ({ ...shot, age: 40 })) }, 2)
    effect.sync(s, 0)
    expect(positions()).toEqual(before)
    effect.sync({ ...s, projectiles: [] }, 0)
    expect(group.children).toHaveLength(0)
    effect.dispose()
  })
})
