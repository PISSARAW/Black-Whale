import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, nextRound, performAuraAttack, tickFight } from './engine'
import { createBodyHatsuClock } from './bodyHatsuPresentation'
import { createBodyHatsuScene } from './bodyHatsuScene'
import { createVisitWeaponScene } from './visitWeaponScene'
import { createProjectileScene } from './projectileScene'
import { createCinematicDirector } from './cinematicDirector'
import { buildFightFigure } from './fighterFigure'
import { animatePadailleWeapon } from './padailleFigure'
import { defaultFightComfort } from './fightComfort'
import { attackData } from './frameData'
import { EMPTY_INPUT, type FighterId, type FightSide, type FightState } from './types'

function duel(id: FighterId, side: FightSide = 'player'): FightState {
  const s = beginFight(
    createFight(side === 'player' ? id : 'hisoka', side === 'opponent' ? id : 'hisoka', {
      mode: 'versus-local',
      formatId: 'knockout',
    }),
  )
  return {
    ...s,
    player: { ...s.player, x: 40, aura: 100 },
    opponent: { ...s.opponent, x: 48, aura: 100 },
  }
}
function cast(state: FightState, side: FightSide, moveId: string) {
  return performAuraAttack({ state, side, kind: 'special', moveId, auraCharged: false })
}
const step = (s: FightState) =>
  tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
const glow = (color: number, opacity = 1) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })

describe('Gel, Padaille and Leorio type 1 presentation', () => {
  for (const side of ['player', 'opponent'] as const) {
    it.each(['gel', 'padaille'] as const)(
      `%s ${side}: accents the actual arm change for 18 simulation frames`,
      (id) => {
        const clock = createBodyHatsuClock(),
          camera = createCinematicDirector({ viewer: () => side })
        let state = duel(id, side)
        clock(state)
        camera.update(state)
        state = cast(state, side, `${id}:neutralSpecial`)
        const ages: number[] = []
        for (let i = 0; i < 65; i++) {
          const before = JSON.stringify(state)
          const age = clock(state)[side][id === 'gel' ? 'gel' : 'tool']
          if (age !== null) ages.push(age)
          expect(camera.update(state).detail).toBeNull()
          expect(JSON.stringify(state)).toBe(before)
          state = step(state)
        }
        expect(ages).toEqual(Array.from({ length: 18 }, (_, i) => i))
        expect(clock(nextRound({ ...state, phase: 'finished', winner: side }))[side].gel).toBeNull()
        expect(createBodyHatsuClock()(state)[side].tool).toBeNull()
      },
    )
    it(`Leorio ${side}: transmission and emergence stay in type 1`, () => {
      let state = duel('leorio', side)
      const camera = createCinematicDirector({ viewer: () => side })
      camera.update(state)
      state = cast(state, side, 'leorio:neutralSpecial')
      let transmission = false,
        emergence = false
      for (let i = 0; i < 75; i++) {
        state = step(state)
        const shot = state.projectiles.find((p) => p.remotePunch)
        if (shot) {
          transmission ||= shot.age < shot.remotePunch!.travelFrames
          emergence ||= shot.age >= shot.remotePunch!.travelFrames
        }
        expect(camera.update(state).detail).toBeNull()
      }
      expect(transmission && emergence).toBe(true)
      expect(state.nextProjectileId).toBe(2)
    })
  }
  it('does not invent a transformation after a rejected cast or loss of Nen', () => {
    const clock = createBodyHatsuClock()
    let state = duel('padaille')
    state = { ...state, player: { ...state.player, aura: 0 } }
    clock(state)
    expect(clock(cast(state, 'player', 'padaille:neutralSpecial')).player.tool).toBeNull()
    state = duel('padaille')
    clock(state)
    state = cast(state, 'player', 'padaille:neutralSpecial')
    clock(state)
    state = step({
      ...state,
      player: {
        ...state.player,
        hatsuEffects: { ...state.player.hatsuEffects, forcedZetsuFrames: 60 },
      },
    })
    expect(clock(state).player.tool).toBeNull()
    expect(state.player.padailleTool).toBeUndefined()
  })
  it('freezes Gel’s physical arm on pause and restores the actual right hand after interruption', () => {
    const scene = new THREE.Scene(),
      figure = new THREE.Group(),
      hand = new THREE.Group()
    hand.name = 'hand-right'
    hand.position.set(3, 1, 0)
    figure.add(hand)
    scene.add(figure)
    const effect = createVisitWeaponScene({
      THREE,
      scene,
      worldX: (x) => x,
      worldY: (y) => y,
      figureOf: () => figure,
    })
    let state = cast(duel('gel'), 'player', 'gel:neutralSpecial')
    effect.sync(state, 0)
    const arm = scene.getObjectByName('gel-snake-arm:player')!
    const first = arm.children[0].scale.toArray()
    effect.sync(state, 300)
    expect(arm.children[0].scale.toArray()).toEqual(first)
    expect(arm.position.toArray()).toEqual([3, 1, 0])
    expect(hand.visible).toBe(false)
    state = { ...state, player: { ...state.player, attack: null, hitStun: 20 } }
    effect.sync(state, 301)
    expect(arm.visible).toBe(false)
    expect(hand.visible).toBe(true)
    effect.dispose()
  })
  it('grows only Padaille’s chosen right-hand tool, freezes its drill and honors reduced motion', () => {
    let state = duel('padaille'),
      comfort = defaultFightComfort()
    const scene = new THREE.Scene(),
      model = buildFightFigure({ THREE, fighter: state.player, glow })
    scene.add(model.root)
    const effect = createBodyHatsuScene({
      THREE,
      scene,
      worldX: (x) => x,
      worldY: (y) => y,
      figureOf: (s) => (s === 'player' ? model.turns : undefined),
      comfort: () => comfort,
    })
    effect.sync(state, 0)
    state = cast(state, 'player', 'padaille:forwardSpecial')
    animatePadailleWeapon(model.turns, state.player, 0)
    effect.sync(state, 0)
    const drill = model.root.getObjectByName('padaille-drill-right-hand')!
    expect(drill.visible).toBe(true)
    expect(drill.scale.x).toBeCloseTo(0.72)
    const before = [drill.scale.toArray(), drill.rotation.toArray()]
    animatePadailleWeapon(model.turns, state.player, 200)
    effect.sync(state, 200)
    expect([drill.scale.toArray(), drill.rotation.toArray()]).toEqual(before)
    comfort = { ...comfort, camera: 0, flashes: false }
    effect.sync(state, 201)
    expect(drill.scale.x).toBe(1)
    expect(drill.visible).toBe(true)
    expect(scene.getObjectByName('body-hatsu:player')!.visible).toBe(false)
    effect.dispose()
    expect(drill.parent).not.toBeNull()
  })
  it('shows Leorio’s concealed emitted fist to its P2 owner and to an observer with Gyo only', () => {
    let state = duel('leorio', 'opponent')
    state = { ...state, opponent: { ...state.opponent, nen: { ...state.opponent.nen, in: true } } }
    state = cast(state, 'opponent', 'leorio:neutralSpecial')
    const startup = attackData('special', state.opponent).startup
    for (let i = 0; i < startup + 1; i++)
      state = tickFight(state, EMPTY_INPUT, {
        dt: 1 / 60,
        opponentInput: { ...EMPTY_INPUT, conceal: true },
      })
    const shot = state.projectiles[0]
    expect(shot.remotePunch).toBeDefined()
    expect(shot.concealed).toBe(true)
    let viewer: FightSide = 'opponent',
      comfort = defaultFightComfort()
    const scene = new THREE.Scene(),
      effect = createProjectileScene({
        THREE,
        scene,
        worldX: (x) => x,
        worldY: (y) => y,
        glow,
        geometry: (g) => g,
        viewer: () => viewer,
        comfort: () => comfort,
      })
    effect.sync(state.projectiles, 0, state.opponent)
    const path = scene.getObjectByName(`remote-punch-path:${shot.id}`)!
    expect(path.userData.stage).toBe('transmission')
    expect(path.getObjectByName('remote-punch-entry')!.visible).toBe(true)
    expect(scene.getObjectByName(`remote-punch:${shot.id}`)!.visible).toBe(false)
    const pose = path.getObjectByName('remote-punch-transmission')!.position.toArray()
    effect.sync(state.projectiles, 900, state.opponent)
    expect(path.getObjectByName('remote-punch-transmission')!.position.toArray()).toEqual(pose)
    viewer = 'player'
    effect.sync(state.projectiles, 901, state.player)
    expect(scene.getObjectByName(`remote-punch-path:${shot.id}`)).toBeUndefined()
    comfort = { ...comfort, camera: 0, flashes: false }
    effect.sync(state.projectiles, 902, {
      ...state.player,
      nen: { ...state.player.nen, gyo: true },
    })
    const reduced = scene.getObjectByName(`remote-punch-path:${shot.id}`)!
    expect(reduced.getObjectByName('remote-punch-entry')!.visible).toBe(false)
    expect(reduced.getObjectByName('remote-punch-transmission')!.visible).toBe(false)
    effect.dispose()
    expect(scene.children).toHaveLength(0)
  })
})
