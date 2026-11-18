import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performMove, performThrow, tickFight } from '../engine'
import { resolveFightImpacts } from '../combatImpact'
import { attackData } from '../frameData'
import { confirmedThrow } from '../throwCinematic'
import { throwBodyPosition } from '../throwCinematicMotion'
import { buildFightFigure } from '../fighterFigure'
import { fightWorldX, fightWorldY } from '../fightCoordinates'
import { selectThrowPerformance } from './selection'
import { createThrowTextiles } from './textiles'
import { createThrowThirdDetails } from './thirdDetails'
import { EMPTY_INPUT, type FighterId, type FightSide, type FightState } from '../types'

function grabbed(options: {
  id: FighterId
  side?: FightSide
  powered?: boolean
  prologue?: boolean
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
    opponent: { ...state.opponent, x: 51, aura: 100 },
  }
  if (options.prologue) {
    state = performMove({ state, side, action: 'special' })
    for (let i = 0; i < 61; i++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
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
  const textiles = createThrowTextiles(options),
    details = createThrowThirdDetails(options)
  return {
    scene,
    figures,
    sync(next = state) {
      const frame = confirmedThrow(next)!
      textiles.hide()
      details.hide()
      textiles.sync(next, frame)
      details.sync(next, frame)
    },
    dispose() {
      textiles.dispose()
      details.dispose()
    },
  }
}
const glow = (color: number, opacity = 1) => new THREE.MeshBasicMaterial({ color, opacity })

describe('third batch: personal equipment follows real combat resources', () => {
  it.each(['player', 'opponent'] as const)(
    'Franklin lifts the victim high and returns to the real landing (%s)',
    (side) => {
      for (const powered of [false, true]) {
        const state = grabbed({ id: 'franklin', side, powered })
        const frame = confirmedThrow(state)!,
          victim = frame.victim
        const at = (t: number) =>
          throwBodyPosition({
            state,
            side: victim,
            frame: { ...frame, age: t * frame.duration },
            fallback: state[victim],
          })
        expect(at(0.55).y).toBeGreaterThan(powered ? 18 : 15)
        expect(at(0.8)).toMatchObject({ x: state[victim].x, y: state[victim].y })
        expect(state.projectiles).toHaveLength(0)
      }
    },
  )

  it.each(['machi', 'kalluto', 'illumi', 'bonolenov'] as const)(
    '%s presentation never adds a gameplay bind, paper, puppet or projectile',
    (id) => {
      for (const powered of [false, true]) {
        const state = grabbed({ id, powered }),
          before = structuredClone(state)
        const view = renderer(state)
        view.sync()
        expect(state).toEqual(before)
        expect(state.projectiles).toHaveLength(0)
        expect(state.opponent.needlePuppet).toBeUndefined()
        expect(state.opponent.plantedPaper).toBeUndefined()
        view.dispose()
        expect(view.scene.children.some((node) => node.name.startsWith('throw-signature:'))).toBe(
          false,
        )
      }
    },
  )

  it('hides Machi’s threads under In from an opponent without Gyo and denies stolen Hatsu', () => {
    const state = grabbed({ id: 'machi', side: 'opponent' })
    const view = renderer(state)
    view.sync()
    const threads = view.scene.getObjectByName('throw-signature:thread')!
    expect(threads.visible).toBe(true)
    const hidden = {
      ...state,
      opponent: { ...state.opponent, nen: { ...state.opponent.nen, in: true } },
    }
    view.sync(hidden)
    expect(threads.visible).toBe(false)
    const stolen = {
      ...state,
      opponent: {
        ...state.opponent,
        hatsuEffects: { ...state.opponent.hatsuEffects, hatsuStolen: 1 },
      },
    }
    expect(selectThrowPerformance(stolen, 'opponent').performance).toBeUndefined()
    view.dispose()
  })

  it('requires real paper or carried needles while retaining physical grappling', () => {
    for (const id of ['kalluto', 'illumi'] as const) {
      const state = grabbed({ id })
      const view = renderer(state)
      view.sync()
      const prop = view.scene.getObjectByName(
        `throw-signature:${id === 'kalluto' ? 'paper' : 'needles'}`,
      )!
      expect(prop.visible).toBe(true)
      const absent = {
        ...state,
        player: { ...state.player, weaponsConfiscated: true, equipment: [] },
      }
      view.sync(absent)
      expect(prop.visible).toBe(false)
      expect(selectThrowPerformance(absent, 'player').performance).toBe(
        confirmedThrow(state)!.performance,
      )
      view.dispose()
    }
  })

  it.each(['player', 'opponent'] as const)(
    'Bonolenov borrows a prepared Prologue without granting it for free (%s)',
    (side) => {
      for (const prologue of [false, true]) {
        const state = grabbed({ id: 'bonolenov', side, powered: true, prologue })
        expect(Boolean(state[side].battleCantabile?.prologue)).toBe(prologue)
        expect(state[side].aura).toBeLessThanOrEqual(prologue ? 40 : 75)
        const view = renderer(state),
          before = structuredClone(state)
        view.sync()
        expect(Boolean(view.figures[side].root.getObjectByName('bonolenov-prologue-spear'))).toBe(
          prologue,
        )
        expect(state).toEqual(before)
        expect(state.projectiles).toHaveLength(0)
        view.dispose()
      }
    },
  )
})
