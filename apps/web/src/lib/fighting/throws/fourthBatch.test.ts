import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performMove, performThrow, tickFight } from '../engine'
import { resolveFightImpacts } from '../combatImpact'
import { attackData } from '../frameData'
import { confirmedThrow } from '../throwCinematic'
import { throwBodyPosition } from '../throwCinematicMotion'
import { buildFightFigure } from '../fighterFigure'
import { fightWorldX, fightWorldY } from '../fightCoordinates'
import { createBiohazardScene } from '../biohazardScene'
import { createThrowFourthScene } from './fourthScene'
import { selectThrowPerformance } from './selection'
import { EMPTY_INPUT, type FighterId, type FightSide, type FightState } from '../types'

const glow = (color: number, opacity = 1) => new THREE.MeshBasicMaterial({ color, opacity })
function grabbed(options: {
  id: FighterId
  side?: FightSide
  powered?: boolean
  pigeon?: boolean
}) {
  const side = options.side ?? 'player'
  let state = beginFight(
    createFight(
      side === 'player' ? options.id : 'hisoka',
      side === 'opponent' ? options.id : 'hisoka',
      { mode: 'versus-local' },
    ),
  )
  state = {
    ...state,
    player: { ...state.player, x: 46, aura: 100 },
    opponent: { ...state.opponent, x: options.pigeon ? 85 : 51, aura: 100 },
  }
  if (options.pigeon) {
    state = performMove({ state, side, action: 'special' })
    for (let i = 0; i < 18; i++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
    state = { ...state, opponent: { ...state.opponent, x: 51 } }
  }
  state = performThrow(state, side, { ...EMPTY_INPUT, aura: Boolean(options.powered) })
  const actor = state[side]
  expect(actor.attack?.variant).toBe('throw')
  return resolveFightImpacts(
    {
      ...state,
      [side]: { ...actor, attack: { ...actor.attack!, frame: attackData('heavy', actor).startup } },
    },
    [],
  )
}
function renderer(state: FightState) {
  const scene = new THREE.Scene()
  const figures = {
    player: buildFightFigure({ THREE, glow, fighter: state.player }),
    opponent: buildFightFigure({ THREE, glow, fighter: state.opponent }),
  }
  scene.add(figures.player.root, figures.opponent.root)
  const options = {
    THREE,
    scene,
    worldX: fightWorldX,
    worldY: fightWorldY,
    figureOf: (side: FightSide) => figures[side].turns,
  }
  const native = createBiohazardScene(options),
    film = createThrowFourthScene(options)
  return {
    scene,
    figures,
    sync(next = state, t = 0.37) {
      const frame = confirmedThrow(next)!
      frame.age = t * frame.duration
      native.sync(next, 0)
      film.hide()
      film.sync(next, frame)
    },
    dispose() {
      native.dispose()
      film.dispose()
    },
  }
}

describe('fourth batch preserves the source and consequences of each personal ability', () => {
  it.each(['shizuku', 'hinrigh', 'mizaistom', 'leorio', 'hanzo'] as const)(
    '%s staging keeps one throw impact and does not mutate game state',
    (id) => {
      for (const powered of [false, true]) {
        const state = grabbed({ id, powered }),
          before = structuredClone(state)
        const view = renderer(state)
        for (const t of [0.1, 0.37, 0.62, 0.85]) view.sync(state, t)
        expect(state).toEqual(before)
        expect(state.projectiles).toHaveLength(0)
        expect(state.opponent.crossGame).toBeUndefined()
        expect(state.opponent.biohazardRestraint).toBeUndefined()
        expect(state.player.hanzoProjection).toBeUndefined()
        view.dispose()
        expect(view.scene.children.some((node) => node.name.startsWith('throw-signature:'))).toBe(
          false,
        )
      }
    },
  )

  it.each(['player', 'opponent'] as const)(
    'Hanzo circles the target and really leaves the floor for the super (%s)',
    (side) => {
      for (const powered of [false, true]) {
        const state = grabbed({ id: 'hanzo', side, powered }),
          frame = confirmedThrow(state)!
        const position = throwBodyPosition({
          state,
          side,
          frame: { ...frame, age: 0.37 * frame.duration },
          fallback: state[side],
        })
        expect((position.x - state[side].x) * frame.facing).toBeGreaterThan(3)
        if (powered) expect(position.y).toBeGreaterThan(8)
        else expect(position.y).toBe(0)
        const landed = throwBodyPosition({
          state,
          side,
          frame: { ...frame, age: 0.8 * frame.duration },
          fallback: state[side],
        })
        expect(landed).toMatchObject({ x: state[side].x, y: state[side].y })
      }
    },
  )

  it('only stages physical cuffs that are really carried, and borrows an already transformed pigeon', () => {
    const state = grabbed({ id: 'hinrigh', powered: true, pigeon: true })
    const item = state.player.biohazard!.objects.find((object) => object.phase === 'flying')!
    expect(item).toBeDefined()
    const view = renderer(state),
      before = structuredClone(state)
    view.sync()
    const bird = view.scene.getObjectByName(`biohazard:player:${item.id}`)!
    const wrist = view.figures.opponent.root
      .getObjectByName('hand-right')!
      .getWorldPosition(new THREE.Vector3())
    expect(bird.position.distanceTo(wrist)).toBeCloseTo(0.12)
    expect(state).toEqual(before)
    view.sync({ ...state, player: { ...state.player, weaponsConfiscated: true } })
    expect(view.scene.getObjectByName('throw-signature:cuffs')!.visible).toBe(false)
    view.dispose()
  })

  it('never manufactures a Cross Game warning or confinement and hides cards without Nen', () => {
    const state = grabbed({ id: 'mizaistom', powered: true }),
      view = renderer(state)
    view.sync()
    expect(view.scene.getObjectByName('throw-signature:referee')!.visible).toBe(true)
    const stolen = {
      ...state,
      player: { ...state.player, hatsuEffects: { ...state.player.hatsuEffects, hatsuStolen: 1 } },
    }
    view.sync(stolen)
    expect(view.scene.getObjectByName('throw-signature:referee')!.visible).toBe(false)
    expect(selectThrowPerformance(stolen, 'player').performance).toBe('mizaistom-custody')
    view.dispose()
  })

  it('requires native Nen for Blinky and the emitted fist but keeps Leorio’s normal physical', () => {
    for (const id of ['shizuku', 'leorio'] as const) {
      const state = grabbed({ id, powered: true }),
        view = renderer(state)
      view.sync()
      const stolen = {
        ...state,
        player: { ...state.player, hatsuEffects: { ...state.player.hatsuEffects, hatsuStolen: 1 } },
      }
      expect(selectThrowPerformance(stolen, 'player').performance).toBeUndefined()
      view.sync(stolen)
      if (id === 'leorio')
        expect(view.scene.getObjectByName('throw-signature:remote')!.visible).toBe(false)
      view.dispose()
    }
    const state = grabbed({ id: 'leorio' })
    expect(
      selectThrowPerformance(
        {
          ...state,
          player: {
            ...state.player,
            hatsuEffects: { ...state.player.hatsuEffects, hatsuStolen: 1 },
          },
        },
        'player',
      ).performance,
    ).toBe('leorio-consultation')
  })
})
