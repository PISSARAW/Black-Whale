import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove } from './engine'
import { attackData, activeHitbox } from './frameData'
import { buildFightFigure } from './fighterFigure'
import { createVisitWeaponScene } from './visitWeaponScene'
import { animateServiceHandgun } from './serviceHandgun'
import { meleeWeaponContact } from './meleeWeaponContact'
import { EMPTY_INPUT, type ArcadeFighter } from './types'

const glow = (color: number) => new THREE.MeshBasicMaterial({ color })

function gelJab() {
  const initial = beginFight(createFight('gel', 'hisoka', { mode: 'versus-local' }))
  return performMove({ state: initial, side: 'player', action: 'light' })
}

describe('sixth wave melee weapons', () => {
  it('registers the arm as Gel’s melee Hatsu while its added reach follows Nen access', () => {
    const started = gelJab()
    const active = started.player
    expect(active.attack).toMatchObject({
      moveId: 'gel:standingLight',
      kind: 'light',
      hatsuSource: 'gel',
    })
    expect(started.opponent.hatsuEffects.witnessedHatsu).toBe('gel')
    active.attack!.frame = attackData('light', active).startup
    const sealed: ArcadeFighter = { ...active, nen: { ...active.nen, mode: 'zetsu' } }
    expect(
      attackData('light', active).box.right - attackData('light', sealed).box.right,
    ).toBeCloseTo(0.85)
    expect(activeHitbox(active)).not.toEqual(activeHitbox(sealed))
    expect(started.projectiles).toHaveLength(0)
  })

  it('draws Gel’s strike from the right wrist and restores the hand when the arm is sealed', () => {
    const state = gelJab()
    const actor = state.player
    actor.attack!.frame = attackData('light', actor).startup
    const scene = new THREE.Scene()
    const figure = buildFightFigure({ THREE, glow, fighter: actor })
    const hand = figure.root.getObjectByName('hand-right')!
    const effect = createVisitWeaponScene({
      THREE,
      scene,
      figureOf: () => figure.turns,
      worldX: (x) => x * 0.115,
      worldY: (y) => y * 0.12,
    })
    try {
      effect.sync(state, 0)
      const arm = scene.getObjectByName('gel-snake-arm:player')!
      expect(arm.visible).toBe(true)
      expect(arm.position.distanceTo(hand.getWorldPosition(new THREE.Vector3()))).toBeCloseTo(0)
      expect(hand.visible).toBe(false)
      state.player.nen.mode = 'zetsu'
      effect.sync(state, 1)
      expect(arm.visible).toBe(false)
      expect(hand.visible).toBe(true)
    } finally {
      effect.dispose()
    }
  })

  it.each([
    ['halkenburg', false],
    ['bill', true],
  ] as const)('%s grips the pistol for a close strike without a muzzle flash', (id, back) => {
    let state = beginFight(createFight(id, 'hisoka', { mode: 'versus-local' }))
    state = performMove({
      state,
      side: 'player',
      action: 'heavy',
      input: { ...EMPTY_INPUT, left: back },
    })
    const fighter = state.player
    const figure = buildFightFigure({ THREE, glow, fighter })
    animateServiceHandgun(figure.turns, fighter)
    const held = figure.root.getObjectByName(`${id}-handgun`)!
    expect(held.parent?.name).toBe('hand-right')
    expect(held.visible).toBe(true)
    expect(figure.root.getObjectByName(`${id}-muzzle-flash`)?.visible).toBe(false)
    expect(meleeWeaponContact(figure.turns, fighter)?.parent).toBe(held)
    animateServiceHandgun(figure.turns, { ...fighter, weaponsConfiscated: true })
    expect(held.visible).toBe(false)
  })
})
