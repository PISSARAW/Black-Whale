import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createFightState } from './fightState'
import { defaultFightComfort } from './fightComfort'
import { fightWorldX, fightWorldY } from './fightCoordinates'
import { fightFigureVisible } from './fightFigureVisibility'
import { fightStance } from './fightStance'
import { feitanIconicPlan, feitanWoundedPlan } from './feitanLocomotion'
import { createFeitanSpeedScene } from './feitanSpeedScene'
import { feitanIconicIdle, feitanSpeedBodyVisible, feitanWounded } from './feitanIdentity'
import type { FightState } from './types'

function dash(state: FightState, frame: number) {
  state.player.motion = {
    velocityX: 90,
    prejumpFrames: 0,
    jumpDirection: 0,
    landingFrames: 0,
    dash: { direction: 1, frame, frames: 14, peak: 140 },
    heldDirection: 0,
    tapDirection: 0,
    tapWindow: 0,
  }
  return state
}

describe('Feitan visual identity', () => {
  it('uses the horizontal-blade guard and a raised free hand at rest', () => {
    const fighter = createFightState('feitan', 'hisoka').player
    expect(feitanIconicIdle(fighter)).toBe(true)
    const pose = feitanIconicPlan(fighter)!.pose
    expect(Math.abs(pose.chest![1])).toBeGreaterThan(0.3)
    expect(pose.leadShoulder![0]).toBeLessThan(-0.8)
    expect(pose.rearElbow![0]).toBeLessThan(-0.9)
    expect(pose.rearWrist).toBeDefined()
  })

  it('hides only presentation frames during a physical dash', () => {
    const state = dash(createFightState('feitan', 'hisoka'), 2)
    expect(feitanSpeedBodyVisible(state.player)).toBe(false)
    expect(fightFigureVisible(state, 'player')).toBe(false)
    state.player.motion!.dash!.frame = 4
    expect(feitanSpeedBodyVisible(state.player)).toBe(true)
    expect(state.player.x).toBe(createFightState('feitan', 'hisoka').player.x)
  })

  it('draws full-body echoes, speed cuts and floor dust, then releases them', () => {
    const scene = new THREE.Scene()
    const figure = new THREE.Group()
    figure.name = 'feitan-production-figure'
    figure.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.2)))
    scene.add(figure)
    const effect = createFeitanSpeedScene({
      THREE,
      scene,
      figureOf: (side) => (side === 'player' ? figure : undefined),
      comfort: defaultFightComfort,
      worldX: fightWorldX,
      worldY: fightWorldY,
    })
    const state = dash(createFightState('feitan', 'hisoka'), 1)
    state.phase = 'fighting'
    effect.sync(state, 0)
    expect(scene.getObjectByName('feitan-afterimage:player')).toBeDefined()
    expect(scene.getObjectByName('feitan-speed-lines:player')!.visible).toBe(true)
    expect(scene.getObjectByName('feitan-dash-dust:player')).toBeDefined()
    state.player.motion!.dash!.frame = 2
    effect.sync(state, 16)
    expect(figure.visible).toBe(false)
    effect.animate(400)
    expect(scene.getObjectByName('feitan-afterimage:player')).toBeUndefined()
    effect.dispose()
    expect(figure.visible).toBe(true)
  })

  it('hangs the damaged arm before Pain Packer rather than treating pain as a number only', () => {
    const fighter = createFightState('feitan', 'hisoka').player
    fighter.hatsuEffects.painPacker = {
      injuries: 60,
      packedDamage: 0,
      armour: false,
      sun: null,
    }
    expect(feitanWounded(fighter)).toBe(true)
    const plan = feitanWoundedPlan(fighter, fightStance('feitan')!.pose)!
    expect(plan.key).toBe('feitan:wounded-arm')
    expect(plan.pose.rearShoulder![0]).toBeGreaterThan(0)
  })
})
