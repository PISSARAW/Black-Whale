import { bodyPlan } from './fightBodyMotion'
import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  beginFight,
  createFight,
  nextRound,
  performAttack,
  performAuraAttack,
  performMove,
  tickFight,
} from './engine'
import { attackData, activeHitbox } from './frameData'
import { hatsuDamageFactor } from './hatsu'
import { hatsuFor } from './hatsu/registry'
import { finisherReady, moveById, moveForSlot, movesetFor } from './movesets'
import { animatePadailleWeapon } from './padailleFigure'
import { padailleKeyedMove } from './padaillePoses'
import { padaillePresentation } from './padaillePresentation'
import { padailleMoveAvailable, type PadailleTool } from './padailleWeapon'
import { buildFightFigure } from './fighterFigure'
import { dolphinIsBusy } from './kurapikaDolphin'
import { EMPTY_INPUT, type FightInput, type FightSide, type FightState } from './types'

const DIRECTIONS: Record<PadailleTool, Partial<FightInput>> = {
  hammer: {},
  drill: { right: true },
  axe: { down: true },
}

function ready(side: FightSide = 'player'): FightState {
  const state = beginFight(
    createFight(
      side === 'player' ? 'padaille' : 'hisoka',
      side === 'player' ? 'hisoka' : 'padaille',
      { mode: 'versus-local' },
    ),
  )
  return {
    ...state,
    player: { ...state.player, x: 42, aura: 100 },
    opponent: { ...state.opponent, x: 52, aura: 100 },
  }
}

function use(state = ready(), tool: PadailleTool = 'hammer'): FightState {
  return performMove({
    state,
    side: 'player',
    action: 'special',
    input: { ...EMPTY_INPUT, ...DIRECTIONS[tool] },
  })
}

function frames(state: FightState, count: number): FightState {
  let next = state
  for (let index = 0; index < count; index++)
    next = tickFight(next, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return next
}

function away(state: FightState): FightState {
  return { ...state, opponent: { ...state.opponent, x: 85 } }
}

describe('Padaille — three chosen right-hand tools', () => {
  it.each(['hammer', 'drill', 'axe'] as const)(
    'selects %s directly, without a random draw or general buff',
    (tool) => {
      const start = ready()
      const state = use(start, tool)
      expect(state.player.padailleTool).toBe(tool)
      expect(state.player.aura).toBe(start.player.aura - 20)
      expect(state.rng).toBe(start.rng)
      expect(state.player.hatsuEffects).not.toHaveProperty('weaponFrames')
      expect(hatsuDamageFactor(state.player)).toBe(hatsuDamageFactor(start.player))
      expect(state.projectiles).toEqual([])
      expect(state.opponent.health).toBe(start.opponent.health)
    },
  )

  it.each(['hammer', 'drill', 'axe'] as const)(
    'lets the %s hit only after its physical startup',
    (tool) => {
      const start = ready()
      const cast = use(start, tool)
      const data = attackData('special', cast.player)
      expect(activeHitbox(cast.player)).toBeNull()
      const struck = frames(cast, data.startup + 3)
      expect(struck.opponent.health).toBeLessThan(start.opponent.health)
      expect(struck.impact?.blocked).toBe(false)
      expect(struck.projectiles).toHaveLength(0)
    },
  )

  it('uses distinct hammer, drill and axe timing/range, without changing unrelated strikes', () => {
    const baseline = ready().player
    const stats = (['hammer', 'drill', 'axe'] as const).map((tool) => {
      const fighter = use(ready(), tool).player
      const normal = {
        ...fighter,
        attack: { ...fighter.attack!, kind: 'light' as const, moveId: 'padaille:standingLight' },
      }
      const plain = { ...baseline, attack: normal.attack }
      expect(attackData('light', normal)).toEqual(attackData('light', plain))
      return attackData('special', fighter)
    })
    expect(new Set(stats.map((data) => data.startup)).size).toBe(3)
    expect(stats[1].box.right).toBeGreaterThan(stats[0].box.right)
    expect(stats[2].damage).toBeGreaterThan(stats[1].damage)
  })

  it('keeps the selected hand beyond three seconds and permits an explicit change', () => {
    const state = frames(use(away(ready()), 'axe'), 210)
    expect(state.player.padailleTool).toBe('axe')
    expect(use(state, 'drill').player.padailleTool).toBe('drill')
  })

  it('restores the right hand without damage, aura cost, projectile, hitbox or finisher', () => {
    const state = frames(use(away(ready()), 'drill'), 50)
    const restored = performMove({
      state,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, left: true },
    })
    expect(restored.player.padailleTool).toBeUndefined()
    expect(restored.player.aura).toBe(state.player.aura)
    expect(restored.opponent.health).toBe(state.opponent.health)
    const active = { ...restored.player, attack: { ...restored.player.attack!, frame: 8 } }
    expect(activeHitbox(active)).toBeNull()
    expect(moveForSlot('padaille', 'finisher')).toBeNull()
    expect(finisherReady(state, 'player')).toBe(false)
  })

  it('keeps guard and distance relevant for every tool', () => {
    for (const tool of ['hammer', 'drill', 'axe'] as const) {
      const start = ready()
      const cast = use(
        { ...start, opponent: { ...start.opponent, blocking: true, guardFrames: 20 } },
        tool,
      )
      let guarded = cast
      const count = attackData('special', cast.player).startup + 4
      for (let index = 0; index < count; index++)
        guarded = tickFight(guarded, EMPTY_INPUT, {
          dt: 1 / 60,
          opponentInput: { ...EMPTY_INPUT, guard: true },
        })
      expect(guarded.impact?.blocked).toBe(true)
      expect(guarded.opponent.health).toBeGreaterThan(0)
      expect(frames(use(away(start), tool), count).opponent.health).toBe(start.opponent.health)
    }
  })

  it('can be interrupted during startup without automatic impalement or execution', () => {
    const state = use(ready(), 'axe')
    const interrupted = { ...state, player: { ...state.player, attack: null, hitStun: 20 } }
    const next = frames(interrupted, 10)
    expect(next.opponent.health).toBe(state.opponent.health)
    expect(next.player.padailleTool).toBe('axe')
  })

  it('transforms only when buffered input actually starts and rechecks its aura', () => {
    const start = ready()
    const stunned = { ...start, player: { ...start.player, hitStun: 3 } }
    const buffered = use(stunned, 'drill')
    expect(buffered.player.padailleTool).toBeUndefined()
    expect(buffered.player.aura).toBe(stunned.player.aura)
    expect(buffered.player.bufferedAttack?.moveId).toBe('padaille:forwardSpecial')
    expect(frames(buffered, 4).player.padailleTool).toBe('drill')
    expect(
      frames({ ...buffered, player: { ...buffered.player, aura: 0 } }, 4).player.padailleTool,
    ).toBeUndefined()
  })

  it.each(['zetsu', 'stolen', 'sealed'] as const)(
    'disallows and clears a transformation when Nen is %s',
    (reason) => {
      const start = use(away(ready()), 'drill')
      const player = { ...start.player, attack: null }
      if (reason === 'zetsu') player.nen = { ...player.nen, mode: 'zetsu' }
      if (reason === 'stolen') player.hatsuEffects = { ...player.hatsuEffects, hatsuStolen: 1 }
      if (reason === 'sealed')
        player.hatsuEffects = { ...player.hatsuEffects, forcedZetsuFrames: 90 }
      const state = { ...start, player }
      expect(padailleMoveAvailable(player, 'padaille:forwardSpecial')).toBe(false)
      expect(use(state).player.attack).toBeNull()
      const next =
        reason === 'zetsu'
          ? tickFight(
              state,
              { ...EMPTY_INPUT, aura: true, down: true },
              { dt: 1 / 60, opponentInput: EMPTY_INPUT },
            )
          : frames(state, 1)
      expect(next.player.padailleTool).toBeUndefined()
    },
  )

  it('rejects the old execution and does not choose a tool through the generic trigger', () => {
    const state = ready()
    expect(
      performAuraAttack({
        state,
        side: 'player',
        kind: 'special',
        moveId: 'padaille:finisher',
        auraCharged: false,
      }),
    ).toBe(state)
    expect(hatsuFor('padaille').onTrigger({ state, side: 'player', source: 'padaille' })).toBe(
      state,
    )
    expect(
      hatsuFor('padaille').onImpact({
        state,
        side: 'player',
        defenderSide: 'opponent',
        source: 'padaille',
        blocked: false,
        concealed: false,
      }),
    ).toBe(state)
  })

  it('keeps ten ordinary physical moves and three tools plus hand restoration', () => {
    const moveset = movesetFor('padaille')!
    expect(moveset.moves).toHaveLength(14)
    expect(moveset.moves.filter((move) => move.category === 'special')).toHaveLength(4)
    expect(moveset.moves.map((move) => move.nameFr).join(' ')).not.toMatch(
      /Faux|jambe|Lance|Canon|Bouclier|souterraine|blindée|Étau|ultime|mort/,
    )
    expect(moveset.combos.flat().every((id) => id.startsWith('padaille:') && moveById(id))).toBe(
      true,
    )
    expect(padaillePresentation(ready(), 'fr').hint).toContain('L marteau')
  })

  it('handles local P2 direction relative to its facing', () => {
    const state = performMove({
      state: ready('opponent'),
      side: 'opponent',
      action: 'special',
      input: { ...EMPTY_INPUT, left: true },
    })
    expect(state.opponent.padailleTool).toBe('drill')
  })

  it('requires Chrollo to free the actual right hand and keeps copied attacks physical', () => {
    const start = beginFight(createFight('chrollo', 'hisoka', { mode: 'versus-local' }))
    const state: FightState = {
      ...start,
      player: {
        ...start.player,
        aura: 100,
        x: 42,
        chrolloBook: { pages: ['padaille'], page: 0, open: true, bookmark: 'padaille' },
      },
      opponent: { ...start.opponent, x: 52 },
    }
    expect(performAttack(state, 'player', 'special')).toBe(state)
    const free = {
      ...state,
      player: { ...state.player, chrolloBook: { ...state.player.chrolloBook!, open: false } },
    }
    const cast = performAttack(free, 'player', 'special')
    expect(cast.player.padailleTool).toBe('hammer')
    expect(hatsuDamageFactor(cast.player)).toBe(1)
    expect(frames(cast, 25).opponent.health).toBeLessThan(state.opponent.health)
    const closed = {
      ...cast,
      player: { ...cast.player, chrolloBook: { ...cast.player.chrolloBook!, bookmark: null } },
    }
    expect(frames(closed, 1).player.padailleTool).toBeUndefined()
  })

  it('preserves the actual drill technique through Dolphin and allows returning the hand', () => {
    const start = beginFight(createFight('kurapika', 'padaille', { mode: 'versus-local' }))
    const state: FightState = {
      ...start,
      player: {
        ...start.player,
        x: 42,
        aura: 100,
        kurapika: {
          ...start.player.kurapika!,
          emperorTime: true,
          held: {
            source: 'padaille',
            victim: 'opponent',
            moveId: 'padaille:forwardSpecial',
            loaded: true,
            used: false,
            sustainedKeys: [],
          },
        },
      },
      opponent: { ...start.opponent, x: 85 },
    }
    const cast = performMove({
      state,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, left: true },
    })
    expect(cast.player.id).toBe('kurapika')
    expect(cast.player.padailleTool).toBe('drill')
    expect(dolphinIsBusy(cast, 'player', cast.player.kurapika!.held!)).toBe(true)
    const restored = performMove({
      state: frames(cast, 50),
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, left: true },
    })
    expect(restored.player.padailleTool).toBeUndefined()
    expect(restored.player.kurapika?.held).toBeNull()
  })

  it.each([1, -1] as const)(
    'extends the right elbow for the drilling thrust when facing %s',
    (facing) => {
      const fighter = use(ready(), 'drill').player
      const active = {
        ...fighter,
        facing,
        attack: { ...fighter.attack!, frame: attackData('special', fighter).startup + 1 },
      }
      const pose = bodyPlan(active, { seconds: 0, progress: 0 })!.pose
      const elbow = facing === 1 ? pose.leadElbow : pose.rearElbow
      const shoulder = facing === 1 ? pose.leadShoulder : pose.rearShoulder
      expect(Math.abs(elbow![0])).toBeLessThan(0.2)
      expect(shoulder![0]).toBeGreaterThan(-1.8)
      expect(shoulder![0]).toBeLessThan(-1.4)
    },
  )

  it('resets the right hand for a new round', () => {
    const state = nextRound({
      ...use(),
      phase: 'finished',
      winner: 'player',
      finishReason: 'knockout',
    })
    expect(state.player.padailleTool).toBeUndefined()
  })

  it.each([1, -1] as const)('draws tools on the anatomical right hand when facing %s', (facing) => {
    const state = ready()
    const fighter = { ...state.player, facing }
    const model = buildFightFigure({
      THREE,
      glow: (colour, opacity) => new THREE.MeshBasicMaterial({ color: colour, opacity }),
      fighter,
    })
    const right = model.root.getObjectByName('hand-right')!
    const left = model.root.getObjectByName('hand-left')!
    for (const tool of ['hammer', 'drill', 'axe'] as const) {
      const cast = { ...use().player, padailleTool: tool, facing }
      animatePadailleWeapon(model.turns, cast, 1)
      expect(right.visible).toBe(false)
      expect(left.visible).toBe(true)
      const weapon = model.root.getObjectByName(`padaille-${tool}-right-hand`)!
      expect(weapon.parent).toBe(right.parent)
      expect(weapon.position).toEqual(right.position)
      expect(weapon.visible).toBe(true)
      const joints = Object.keys(padailleKeyedMove(cast)!.timeline[0].pose)
      expect(joints).toContain(facing === 1 ? 'leadShoulder' : 'rearShoulder')
    }
    animatePadailleWeapon(model.turns, fighter, 2)
    expect(right.visible).toBe(true)
    expect(
      ['hammer', 'drill', 'axe'].every(
        (tool) => !model.root.getObjectByName(`padaille-${tool}-right-hand`)!.visible,
      ),
    ).toBe(true)
  })
})
