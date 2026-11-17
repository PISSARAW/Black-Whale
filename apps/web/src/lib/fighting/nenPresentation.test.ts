import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createFight } from './engine'
import { createProjectileScene } from './projectileScene'
import { createNenFieldScene } from './nenFieldScene'
import { applyAuraContext, focusAttackRyu, focusGuardRyu } from './nen'
import { focusNenZone } from './nenAdvanced'
import { gyoSight, perceivesProjectile, enContacts } from './nenPerception'
import { strikeDefender } from './combatDamage'
import { EMPTY_INPUT, type FightProjectile } from './types'

const aura = (fighter: ReturnType<typeof createFight>['player'], partial = {}) =>
  applyAuraContext(fighter, { ...EMPTY_INPUT, ...partial })

const projectile: FightProjectile = {
  id: 1,
  owner: 'opponent',
  fighterId: 'franklin',
  matter: 'nen',
  concealed: true,
  x: 50,
  y: 6,
  velocityX: -80,
  width: 0.5,
  height: 0.3,
  damage: 10,
  hitstun: 10,
  blockstun: 6,
  hitstop: 2,
  knockback: 1,
  targetZone: 'torso',
  shape: 'bullet',
  colour: '#ff0000',
  age: 0,
  lifetime: 90,
}

function setup() {
  const scene = new THREE.Scene()
  const renderer = createProjectileScene({
    THREE,
    scene,
    worldX: (x) => x,
    worldY: (y) => y,
    geometry: (value) => value,
    glow: (color, opacity) => new THREE.MeshBasicMaterial({ color, opacity, transparent: true }),
  })
  return { scene, renderer }
}

describe('Nen perception in the rendered duel', () => {
  it('keeps a concealed projectile hidden under En while Gyo reveals its visual form', () => {
    const { scene, renderer } = setup()
    const fighter = { ...createFight('hinrigh', 'franklin').player, x: 40 }
    renderer.sync([projectile], 0, fighter)
    const mesh = scene.getObjectByName('fight-projectile:1')!
    expect(mesh.visible).toBe(false)
    renderer.sync([projectile], 0, aura(fighter, { gyo: true }))
    expect(mesh.visible).toBe(true)
    renderer.sync([projectile], 0, aura(fighter, { en: true }))
    expect(mesh.visible).toBe(false)
    renderer.sync([{ ...projectile, x: 95 }], 0, aura(fighter, { en: true }))
    expect(mesh.visible).toBe(false)
    renderer.dispose()
  })

  it('keeps the real object visible while In hides only its Shu envelope, and removes expired Shu', () => {
    const { scene, renderer } = setup()
    const fighter = createFight('phinks', 'hisoka').player
    const card = {
      ...projectile,
      matter: 'object' as const,
      shape: 'card' as const,
      shuCharged: true,
    }
    renderer.sync([card], 0, fighter)
    const mesh = scene.getObjectByName('fight-projectile:1')!
    expect(mesh.visible).toBe(true)
    expect(mesh.children[0].visible).toBe(false)
    renderer.sync([card], 0, aura(fighter, { gyo: true }))
    expect(mesh.children[0].visible).toBe(true)
    renderer.sync([{ ...card, shuCharged: false }], 0, aura(fighter, { gyo: true }))
    expect(mesh.children[0].visible).toBe(false)
    renderer.dispose()
  })

  it('does not leak a hostile En radius hidden by In', () => {
    const scene = new THREE.Scene()
    const fields = createNenFieldScene({ THREE, scene, worldX: (x) => x, worldY: (y) => y })
    const state = createFight('phinks', 'hinrigh')
    state.opponent = aura(state.opponent, { en: true, conceal: true })
    fields.sync(state)
    expect(scene.children[1].visible).toBe(false)
    state.player = aura(state.player, { gyo: true })
    fields.sync(state)
    expect(scene.children[1].visible).toBe(true)
    fields.dispose()
  })

  it('Gyo cannot restore sealed eyesight, while En can still sense nearby displacement', () => {
    const fighter = { ...createFight('phinks', 'hisoka').player, x: 40 }
    fighter.hatsuEffects = { ...fighter.hatsuEffects, senseSeals: 1 }
    expect(gyoSight(aura(fighter, { gyo: true }))).toBe(false)
    expect(perceivesProjectile(aura(fighter, { gyo: true }), projectile)).toBe(false)
    expect(perceivesProjectile(aura(fighter, { en: true }), projectile)).toBe(false)
    const state = createFight('phinks', 'hisoka')
    state.player = aura(fighter, { en: true })
    state.opponent.x = 95
    state.projectiles = [{ ...projectile, concealed: false }]
    expect(enContacts(state, 'player')).toBe(1)
  })

  it('does not reopen aura through a Ryu parry or focus while in Zetsu', () => {
    const fighter = aura(createFight('phinks', 'hisoka').player, { aura: true, down: true })
    expect(focusNenZone(fighter, 'head')).toBe(fighter)
    expect(focusGuardRyu(fighter, 'head')).toBe(fighter)
    expect(focusAttackRyu(fighter, 'light')).toBe(fighter)
  })

  it('releases Ko when a received strike interrupts the committed attack', () => {
    const state = createFight('phinks', 'hisoka')
    const fighter = {
      ...state.player,
      nen: { ...state.player.nen, ko: 'hands' as const, ryu: { hands: 1 } },
    }
    const hit = strikeDefender({
      fighter,
      attacker: state.opponent,
      damage: 10,
      blocked: false,
      knockdown: false,
      antiAir: false,
      wallSplat: false,
      counterHit: true,
      comboHits: 1,
    })
    expect(hit.nen.ko).toBeNull()
    expect(hit.nen.ryu).toEqual({})
  })
})
