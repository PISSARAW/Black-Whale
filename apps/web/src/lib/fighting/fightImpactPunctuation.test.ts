import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { strikeCameraAccent } from './combatCameraAccent'
import { createFightImpactScene } from './fightImpactScene'
import { fightImpactPunctuation } from './fightImpactPunctuation'
import { createFightState } from './fightState'
import { defaultFightComfort } from './fightComfort'
import type { FightImpact, FightState } from './types'
import { FEITAN_FINAL_REVERSAL, FEITAN_SECOND_CUT } from './feitanSignatureImpact'

function impact(flags: Partial<FightImpact> = {}): FightImpact {
  return {
    sequence: 1,
    attacker: 'player',
    kind: 'heavy',
    blocked: false,
    parried: false,
    avoided: false,
    invulnerable: false,
    critical: false,
    counterHit: false,
    punish: false,
    knockdown: false,
    wallSplat: false,
    zone: 'torso',
    projectileId: null,
    transfer: false,
    objectTransfer: false,
    concealed: false,
    damage: 20,
    points: 0,
    position: { x: 50, y: 8 },
    ...flags,
  } as FightImpact
}

describe('shared impact punctuation', () => {
  it.each(['player', 'opponent'] as const)(
    'emits Feitan’s second spark on the posed blade for %s',
    (side) => {
      const state = createFightState(
        side === 'player' ? 'feitan' : 'kurapika',
        side === 'player' ? 'kurapika' : 'feitan',
      )
      const figure = new THREE.Group()
      const blade = new THREE.Group()
      figure.position.set(0.2, 1.13, 0.44)
      blade.name = `feitan-blade:${side}`
      blade.rotation.z = side === 'player' ? 1.2 : -1.2
      figure.add(blade)
      state[side].attack = {
        moveId: FEITAN_SECOND_CUT,
        kind: 'light',
        frame: 6,
        impacted: true,
        confirmedHit: true,
        auraCharged: false,
        concealed: false,
        hatsuSource: null,
        projectileSpawned: false,
        reversal: false,
      }
      const scene = new THREE.Scene()
      const effect = createFightImpactScene({
        THREE,
        scene,
        initial: state,
        comfort: defaultFightComfort,
        figureOf: () => figure,
        geometry: (made) => made,
        glow: (color) => new THREE.MeshBasicMaterial({ color }),
      })
      effect.emit({ ...state, impact: impact({ attacker: side, kind: 'light' }) }, 0)
      const mark = scene.getObjectByName('fight-contact-hit')!
      expect(mark).toBeDefined()
      const edge = new THREE.Line3(
        blade.localToWorld(new THREE.Vector3(0, -0.15, 0)),
        blade.localToWorld(new THREE.Vector3(0, -0.95, 0)),
      )
      expect(
        edge
          .closestPointToPoint(mark.position, true, new THREE.Vector3())
          .distanceTo(mark.position),
      ).toBeLessThan(0.00001)
    },
  )

  it('gives a clean reversal its own camera and sound emphasis while preserving guard', () => {
    const ordinary = fightImpactPunctuation(impact({ knockdown: true }))
    const reversal = fightImpactPunctuation(impact({ knockdown: true }), FEITAN_FINAL_REVERSAL)
    expect(reversal.cameraPush).toBeGreaterThan(ordinary.cameraPush)
    expect(reversal.thumpHz).toBeLessThan(ordinary.thumpHz)
    expect(fightImpactPunctuation(impact({ blocked: true }), FEITAN_FINAL_REVERSAL)).toEqual(
      fightImpactPunctuation(impact({ blocked: true })),
    )
  })
  it('ranks light, heavy and decisive contacts and silences evasions', () => {
    const light = fightImpactPunctuation(impact({ kind: 'light' }))
    const heavy = fightImpactPunctuation(impact())
    const counter = fightImpactPunctuation(impact({ counterHit: true }))
    expect(light.rank).toBe(1)
    expect(heavy.rank).toBe(2)
    expect(counter.rank).toBe(3)
    expect(counter.rays).toBeGreaterThan(heavy.rays)
    expect(fightImpactPunctuation(impact({ avoided: true }))).toMatchObject({
      rank: 0,
      rays: 0,
      wave: false,
    })
  })

  it('makes guard recoil and head / low contacts point camera accents differently', () => {
    expect(fightImpactPunctuation(impact({ blocked: true })).direction).toBeLessThan(0)
    expect(fightImpactPunctuation(impact({ zone: 'head' })).cameraLook).toBeGreaterThan(0)
    expect(fightImpactPunctuation(impact({ zone: 'feet' })).cameraLook).toBeLessThan(0)
  })

  it('adds directional rays and a heavy wave at the anatomical contact', () => {
    const state = createFightState('phinks', 'kurapika') as FightState
    state.phase = 'fighting'
    state.player.attack = {
      kind: 'heavy',
      frame: 20,
      impacted: true,
      confirmedHit: true,
      auraCharged: false,
      concealed: false,
      hatsuSource: null,
      projectileSpawned: false,
      reversal: false,
    }
    state.impact = impact({ counterHit: true })
    const scene = new THREE.Scene()
    const effect = createFightImpactScene({
      THREE,
      scene,
      initial: { ...state, impact: null },
      comfort: defaultFightComfort,
      geometry: (made) => made,
      glow: (color) => new THREE.MeshBasicMaterial({ color }),
    })
    effect.emit(state, 100)
    expect(scene.getObjectByName('fight-contact-wave')).toBeDefined()
    expect(scene.children.filter(({ name }) => name === 'fight-contact-ray')).toHaveLength(10)
    const before = scene.children.length
    effect.emit(state, 100)
    expect(scene.children).toHaveLength(before)
    effect.animate(500)
    expect(scene.children).toHaveLength(0)
  })

  it('feeds the same decisive contact into the camera phrase', () => {
    const state = createFightState('phinks', 'kurapika') as FightState
    state.player.attack = {
      kind: 'heavy',
      frame: 20,
      impacted: true,
      confirmedHit: true,
      auraCharged: false,
      concealed: false,
      hatsuSource: null,
      projectileSpawned: false,
      reversal: false,
    }
    state.impact = impact()
    const plain = strikeCameraAccent(state, 'player')
    state.impact = impact({ counterHit: true, zone: 'head' })
    const counter = strikeCameraAccent(state, 'player')
    expect(counter.push).toBeGreaterThan(plain.push)
    expect(counter.look).toBeGreaterThan(plain.look)
    expect(Math.abs(counter.tilt)).toBeGreaterThan(Math.abs(plain.tilt))
  })
})
