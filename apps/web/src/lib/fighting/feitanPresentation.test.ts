import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performMove, tickFight } from './engine'
import { recordFightInjuries } from './feitanPain'
import { createFeitanPresentationClock, armourReveal } from './feitanPresentation'
import { createFeitanScene } from './feitanScene'
import { buildFightFigure } from './fighterFigure'
import { createCinematicDirector } from './cinematicDirector'
import { defaultFightComfort } from './fightComfort'
import { aimCinematicFocus } from './cinematicFocus'
import { fightWorldX, fightWorldY } from './fightCoordinates'
import { EMPTY_INPUT, type FightState } from './types'

const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })
function fresh(id: 'feitan' | 'chrollo' = 'feitan'): FightState {
  const initial = beginFight(
    createFight(id, 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  const base = {
    ...initial,
    player: { ...initial.player, x: 45 },
    opponent: { ...initial.opponent, x: 61 },
  }
  return recordFightInjuries(base, {
    ...base,
    player: { ...base.player, health: base.player.health - 40 },
  })
}
function advance(state: FightState, count: number) {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function fixture() {
  const initial = fresh()
  const model = buildFightFigure({ THREE, glow, fighter: initial.player })
  const scene = new THREE.Scene()
  scene.add(model.root)
  const comfort = defaultFightComfort()
  let reduced = false
  const effects = createFeitanScene({
    THREE,
    scene,
    initial,
    worldX: fightWorldX,
    worldY: fightWorldY,
    figureOf: () => model.turns,
    comfort: () => comfort,
    reducedMotion: () => reduced,
  })
  return {
    initial,
    model,
    scene,
    effects,
    comfort,
    reduce: () => {
      reduced = true
    },
  }
}

describe('Feitan manifestation animations', () => {
  it('keeps the full-body frontal camera above the floor while Feitan bows his head', () => {
    const actor = new THREE.Group()
    const hood = new THREE.Group()
    hood.name = 'pain-packer-hood:combat-joint'
    hood.userData.cameraFrontal = true
    hood.position.y = 1.6
    hood.rotation.x = 0.65
    hood.add(new THREE.Mesh(new THREE.SphereGeometry(0.2), glow(0x641f36, 1)))
    actor.add(hood)
    const scene = new THREE.Scene()
    scene.add(actor)
    const camera = new THREE.PerspectiveCamera(28, 1.8, 0.01, 100)
    expect(
      aimCinematicFocus({
        scene,
        camera,
        figureOf: () => actor,
        state: fresh(),
        detail: {
          side: 'player',
          kind: 'focus',
          labelFr: '',
          labelEn: '',
          frontal: true,
          anchors: [
            { type: 'rig', side: 'player', part: 'body' },
            { type: 'node', actor: 'player', name: hood.name },
          ],
        },
      }),
    ).toBe(true)
    expect(camera.position.y).toBeGreaterThan(0.8)
  })
  it('starts the armour sequence at the accepted manifestation, not on the command', () => {
    const initial = fresh()
    const clock = createFeitanPresentationClock(initial)
    let state = performMove({ state: initial, side: 'player', action: 'special' })
    expect(clock(state).player).toBeNull()
    for (let i = 0; i < 18; i++) {
      state = advance(state, 1)
      clock(state)
    }
    expect(state.player.hatsuEffects.painPacker?.armour).toBe(true)
    expect(clock(state).player).toBe(0)
    const later = advance(state, 36)
    expect(clock(later).player).toBe(36)
    expect(clock(later).player).toBe(36)
    expect(clock(advance(later, 36)).player).toBeNull()
    expect(clock(state).player).toBeNull()
  })

  it('does not animate rejected armour or invent a sun when no pain is committed', () => {
    const initial = beginFight(createFight('feitan', 'hisoka', { mode: 'versus-local' }))
    const clock = createFeitanPresentationClock(initial)
    const refused = performMove({ state: initial, side: 'player', action: 'special' })
    expect(refused).toBe(initial)
    expect(clock(refused).player).toBeNull()
    const sun = performMove({ state: fresh(), side: 'player', action: 'finisher' })
    expect(sun.player.hatsuEffects.painPacker?.sun).toBeFalsy()
  })

  it('reveals coat, sleeves and hood in order and restores the wearer on cancellation', () => {
    const f = fixture()
    f.effects.sync(f.initial, 0)
    let state = advance(performMove({ state: f.initial, side: 'player', action: 'special' }), 18)
    f.effects.sync(state, 1)
    const armour = f.model.root.getObjectByName('pain-packer:player')!
    expect(armour.userData.reveal).toEqual(armourReveal(0))
    expect(f.model.root.getObjectByName('manga-head:feitan-portor')!.visible).toBe(true)
    state = advance(state, 35)
    f.effects.sync(state, 999)
    expect(armour.userData.reveal.coat).toBe(1)
    expect(armour.userData.reveal.hood).toBeGreaterThan(0)
    expect(armour.userData.reveal.hood).toBeLessThan(1)
    expect(f.model.root.getObjectByName('manga-long-coat')!.visible).toBe(false)
    state = advance(state, 30)
    f.effects.sync(state, 1000)
    expect(armour.userData.reveal).toEqual(armourReveal(null))
    expect(f.model.root.getObjectByName('manga-head:feitan-portor')!.visible).toBe(false)
    const cancelled = {
      ...state,
      player: {
        ...state.player,
        hatsuEffects: {
          ...state.player.hatsuEffects,
          painPacker: { ...state.player.hatsuEffects.painPacker!, armour: false },
        },
      },
    }
    f.effects.sync(cancelled, 1001)
    expect(armour.visible).toBe(false)
    expect(f.model.root.getObjectByName('manga-head:feitan-portor')!.visible).toBe(true)
    expect(f.model.root.getObjectByName('manga-long-coat')!.visible).toBe(true)
    f.effects.dispose()
  })

  it('finishes solar core formation before the first heat pulse and never delays the true hazard', () => {
    const f = fixture()
    const armoured = advance(
      performMove({ state: f.initial, side: 'player', action: 'special' }),
      90,
    )
    let state = advance(performMove({ state: armoured, side: 'player', action: 'finisher' }), 30)
    expect(state.player.hatsuEffects.painPacker?.sun?.age).toBe(0)
    f.effects.sync(state, 0)
    const sun = f.scene.getObjectByName('rising-sun:player')!
    const boundary = f.scene.getObjectByName('solar-heat:player')!
    expect(sun.visible).toBe(true)
    expect(boundary.visible).toBe(true)
    expect(boundary.scale.x).toBeCloseTo(state.player.hatsuEffects.painPacker!.sun!.radius * 0.115)
    const small = sun.scale.x
    state = advance(state, 12)
    f.effects.sync(state, 1)
    const source = state.player.hatsuEffects.painPacker!.sun!
    expect(sun.scale.x).toBeGreaterThan(small)
    expect(sun.scale.x).toBeCloseTo(0.18 + source.radius * 0.008)
    const solar = f.scene.getObjectByName('rising-sun-corona')!.children[0] as THREE.Mesh<
      THREE.BufferGeometry,
      THREE.ShaderMaterial
    >
    const time = solar.material.uniforms.solarTime.value
    f.effects.sync(state, 999)
    expect(solar.material.uniforms.solarTime.value).toBe(time)
    f.reduce()
    f.effects.sync(state, 1000)
    expect(solar.material.uniforms.solarTime.value).toBe(0)
    f.effects.dispose()
    expect(f.scene.children).toEqual([f.model.root])
  })

  it('keeps gameplay identical through the armour and solar camera sequences', () => {
    const f = fixture()
    const director = createCinematicDirector()
    director.update(f.initial)
    let state = performMove({ state: f.initial, side: 'player', action: 'special' })
    let control = state
    const events = new Set<string>()
    for (let frame = 0; frame < 240; frame++) {
      if (frame === 100) {
        state = performMove({ state, side: 'player', action: 'finisher' })
        control = performMove({ state: control, side: 'player', action: 'finisher' })
      }
      const detail = director.update(state).detail
      if (detail?.eventId) events.add(detail.eventId)
      f.effects.sync(state, frame / 60)
      state = advance(state, 1)
      control = advance(control, 1)
    }
    expect(events.has('feitan.armour')).toBe(true)
    expect(events.has('feitan.sun')).toBe(true)
    expect(state).toEqual(control)
    f.effects.dispose()
  })
})
