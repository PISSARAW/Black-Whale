import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, nextRound, performAttack, performMove, tickFight } from './engine'
import {
  CROSS_GAME_COST,
  CROSS_GAME_MOVE,
  CROSS_GAME_RANGE,
  CROSS_GAME_RESTRAINT,
} from './crossGame'
import { createCrossGameScene } from './crossGameScene'
import { crossGamePresentation } from './crossGamePresentation'
import { hatsuFor } from './hatsu/registry'
import { canSpeak } from './saiyuSenses'
import { canBufferFighterAttack, canStartFighterAttack } from './fighterAttacks'
import { canUseMovesetMove, finisherReady, moveForSlot, movesetFor } from './movesets'
import { dolphinIsBusy } from './kurapikaDolphin'
import { EMPTY_INPUT, type FightInput, type FightSide, type FightState } from './types'

function ready(side: FightSide = 'player'): FightState {
  const state = beginFight(
    createFight(
      side === 'player' ? 'mizaistom' : 'hisoka',
      side === 'player' ? 'hisoka' : 'mizaistom',
      { mode: 'versus-local' },
    ),
  )
  return {
    ...state,
    player: { ...state.player, x: 40, aura: 100 },
    opponent: { ...state.opponent, x: 56, aura: 100 },
  }
}

function warn(state = ready(), side: FightSide = 'player'): FightState {
  return performAttack(state, side, 'special')
}

function frames(state: FightState, count: number, input: Partial<FightInput> = {}): FightState {
  let next = state
  for (let frame = 0; frame < count; frame++)
    next = tickFight(next, { ...EMPTY_INPUT, ...input }, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return next
}

function disobey(state = warn(), side: FightSide = 'opponent'): FightState {
  return performAttack(frames(state, 18), side, 'light')
}

describe('Mizaistom — conditional yellow card', () => {
  it('gives a moving player time to read the warning and stop without being punished', () => {
    const start = warn(ready('opponent'), 'opponent')
    const moving = frames(start, 10, { right: true })
    expect(moving.player.crossGame?.phase).toBe('warning')
    expect(frames(moving, 25).player.crossGame?.phase).toBe('warning')
    expect(frames(start, 20, { right: true }).player.crossGame?.phase).toBe('restrained')
  })

  it('lets the warned target guard with Ken and speak while obeying', () => {
    let state = warn()
    for (let frame = 0; frame < 25; frame++)
      state = tickFight(state, EMPTY_INPUT, {
        dt: 1 / 60,
        opponentInput: { ...EMPTY_INPUT, guard: true, aura: true },
      })
    expect(state.opponent.crossGame?.phase).toBe('warning')
    expect(state.opponent.blocking).toBe(true)
    expect(state.opponent.nen.ken).toBe(true)
    expect(canSpeak(state.opponent)).toBe(true)
  })

  it('warns without a strike, damage, points, stun or initial restraint', () => {
    const start = ready()
    const state = warn(start)
    expect(state.player.aura).toBe(start.player.aura - CROSS_GAME_COST)
    expect(state.player.attack).toBeNull()
    expect(state.opponent.crossGame).toMatchObject({ owner: 'player', phase: 'warning' })
    expect(state.opponent.health).toBe(start.opponent.health)
    expect(state.opponent.hitStun).toBe(0)
    expect(state.opponent.hatsuEffects.restrainedFrames).toBe(0)
    expect(state.score).toEqual(start.score)
    expect(state.projectiles).toEqual([])
    expect(state.opponent.hatsuEffects.witnessedHatsu).toBe('mizaistom')
  })

  it('lets a compliant opponent remain free, including normal guard and basic Nen', () => {
    const state = frames(warn(), 180, { guard: true })
    expect(state.opponent.crossGame?.phase).toBe('warning')
    expect(state.opponent.hatsuEffects.restrainedFrames).toBe(0)
    expect(state.opponent.hitStun).toBe(0)
    expect(state.opponent.health).toBe(ready().opponent.health)
  })

  it('does not turn a second L into unconditional restraint or spend more aura', () => {
    const state = frames(warn(), 20)
    expect(warn(state)).toBe(state)
    expect(state.opponent.crossGame?.phase).toBe('warning')
  })

  it('confines on a new attack after warning, without letting that attack start', () => {
    const start = warn()
    const state = disobey(start)
    expect(state.opponent.crossGame?.phase).toBe('restrained')
    expect(state.opponent.hatsuEffects.restrainedFrames).toBe(CROSS_GAME_RESTRAINT)
    expect(state.opponent.attack).toBeNull()
    expect(state.opponent.bufferedAttack).toBeNull()
    expect(state.opponent.aura).toBe(start.opponent.aura)
    expect(state.player.health).toBe(start.player.health)
  })

  it.each(['left', 'right', 'jump'] as const)('confines P1 when deliberately using %s', (key) => {
    const start = warn(ready('opponent'), 'opponent')
    const state = frames(frames(start, 18), 1, { [key]: true })
    expect(state.player.crossGame?.phase).toBe('restrained')
    expect(state.player.attack).toBeNull()
  })

  it('enforces the same movement condition for P2 local', () => {
    const state = tickFight(frames(warn(), 18), EMPTY_INPUT, {
      dt: 1 / 60,
      opponentInput: { ...EMPTY_INPUT, left: true },
    })
    expect(state.opponent.crossGame?.phase).toBe('restrained')
  })

  it('enforces the movement condition for the AI too', () => {
    const state = tickFight(frames(warn(), 18), EMPTY_INPUT, { dt: 1 / 60, ai: true })
    expect(state.opponent.crossGame?.phase).toBe('restrained')
  })

  it('does not punish an invalid attack attempted under hitstun', () => {
    const start = warn()
    const state = { ...start, opponent: { ...start.opponent, hitStun: 10 } }
    const next = performAttack(state, 'opponent', 'light')
    expect(next.opponent.crossGame?.phase).toBe('warning')
  })

  it('does not punish a jump/attack already underway when the warning is issued', () => {
    const start = ready()
    const airborne = warn({ ...start, opponent: { ...start.opponent, y: 4, velocityY: 20 } })
    expect(frames(airborne, 4).opponent.crossGame?.phase).toBe('warning')
    const attacking = warn(performAttack(start, 'opponent', 'light'))
    expect(frames(attacking, 2).opponent.crossGame?.phase).toBe('warning')
  })

  it('does not mistake impact knockback or pushbox separation for disobedience', () => {
    const start = ready()
    const close = {
      ...start,
      player: { ...start.player, x: 45 },
      opponent: { ...start.opponent, x: 49 },
    }
    const state = frames(performAttack(frames(warn(close), 20), 'player', 'light'), 15)
    expect(state.opponent.health).toBeLessThan(ready().opponent.health)
    expect(state.opponent.crossGame?.phase).toBe('warning')
    expect(state.opponent.hatsuEffects.restrainedFrames).toBe(0)
  })

  it('blocks movement, jump, attacks and attack buffering while confined, without silencing', () => {
    const start = disobey()
    const fixed = start.opponent.x
    const state = tickFight(start, EMPTY_INPUT, {
      dt: 1 / 60,
      opponentInput: { ...EMPTY_INPUT, right: true, jump: true },
    })
    expect(state.opponent.x).toBe(fixed)
    expect(state.opponent.velocityY).toBe(0)
    expect(state.opponent.hitStun).toBe(0)
    expect(canSpeak(state.opponent)).toBe(true)
    expect(canStartFighterAttack(state.opponent, 'light')).toBe(false)
    expect(canBufferFighterAttack(state.opponent)).toBe(false)
    expect(performAttack(state, 'opponent', 'light')).toBe(state)
    expect(state.opponent.nen.mode).not.toBe('zetsu')
  })

  it('releases after a brief confinement, then permits a fresh warning', () => {
    const state = frames(disobey(), CROSS_GAME_RESTRAINT)
    expect(state.opponent.crossGame).toBeUndefined()
    expect(state.opponent.hatsuEffects.restrainedFrames).toBe(0)
    expect(performAttack(state, 'opponent', 'light').opponent.attack).not.toBeNull()
    expect(warn(state).opponent.crossGame?.phase).toBe('warning')
  })

  it.each(['warning', 'restrained'] as const)(
    'ends %s if the caster loses the ability',
    (phase) => {
      const start = phase === 'warning' ? warn() : disobey()
      const state = frames(
        {
          ...start,
          player: {
            ...start.player,
            hatsuEffects: { ...start.player.hatsuEffects, hatsuStolen: 1 },
          },
        },
        1,
      )
      expect(state.opponent.crossGame).toBeUndefined()
      expect(state.opponent.hatsuEffects.restrainedFrames).toBe(0)
    },
  )

  it('does not warn beyond range or cancel an ongoing physical attack', () => {
    const start = ready()
    const far = {
      ...start,
      opponent: { ...start.opponent, x: start.player.x + CROSS_GAME_RANGE + 1 },
    }
    expect(warn(far)).toBe(far)
    const attacking = performAttack(start, 'player', 'light')
    expect(warn(attacking)).toBe(attacking)
  })

  it('requires enough aura, available Nen and a visible/audible warning', () => {
    const start = ready()
    for (const aura of [0, CROSS_GAME_COST - 1]) {
      const state = { ...start, player: { ...start.player, aura } }
      expect(warn(state)).toBe(state)
    }
    const zetsu: FightState = {
      ...start,
      player: { ...start.player, nen: { ...start.player.nen, mode: 'zetsu' } },
    }
    expect(warn(zetsu)).toBe(zetsu)
    for (const senseSeals of [1, 2]) {
      const state = {
        ...start,
        opponent: {
          ...start.opponent,
          hatsuEffects: { ...start.opponent.hatsuEffects, senseSeals },
        },
      }
      expect(warn(state)).toBe(state)
    }
  })

  it('never applies restraint on physical contact or an obsolete special impact hook', () => {
    const start = ready()
    expect(
      hatsuFor('mizaistom').onImpact({
        state: start,
        side: 'player',
        defenderSide: 'opponent',
        source: 'mizaistom',
        blocked: false,
        concealed: false,
      }),
    ).toBe(start)
    const state = frames(performAttack(start, 'player', 'heavy'), 30)
    expect(state.opponent.crossGame).toBeUndefined()
  })

  it('keeps only ten physical moves and the yellow card, with all directional L inputs routed to it', () => {
    const moveset = movesetFor('mizaistom')!
    expect(moveset.moves).toHaveLength(11)
    expect(
      moveset.moves.filter((move) => move.category === 'special').map((move) => move.id),
    ).toEqual([CROSS_GAME_MOVE])
    expect(moveForSlot('mizaistom', 'finisher')).toBeNull()
    expect(finisherReady(disobey(), 'player')).toBe(false)
    expect(moveset.moves.map((move) => move.nameFr).join(' ')).not.toMatch(
      /Verdict|Zone|bleue|rouge|judiciaire|Sentence|Mandat/,
    )
    for (const direction of [{}, { right: true }, { left: true }, { down: true }]) {
      const state = performMove({
        state: ready(),
        side: 'player',
        action: 'special',
        input: { ...EMPTY_INPUT, ...direction },
      })
      expect(state.opponent.crossGame?.phase).toBe('warning')
    }
  })

  it('exposes the order and availability in the HUD', () => {
    expect(crossGamePresentation(ready(), 'fr').ready).toBe(true)
    expect(crossGamePresentation(warn(), 'fr').ready).toBe(false)
    expect(crossGamePresentation(ready(), 'fr').hint).toContain('Ne bougez plus')
    expect(canUseMovesetMove(warn(), 'player', moveForSlot('mizaistom', 'neutralSpecial')!)).toBe(
      false,
    )
  })

  it('preserves the warning/violation conditions for Chrollo and releases a closed page', () => {
    const start = beginFight(createFight('chrollo', 'hisoka', { mode: 'versus-local' }))
    const state = {
      ...start,
      player: {
        ...start.player,
        x: 40,
        chrolloBook: { pages: ['mizaistom'] as const, page: 0, open: true, bookmark: null },
      },
      opponent: { ...start.opponent, x: 56 },
    }
    const warned = performAttack(state, 'player', 'special')
    expect(warned.opponent.crossGame?.phase).toBe('warning')
    expect(disobey(warned).opponent.crossGame?.phase).toBe('restrained')
    const closed = {
      ...warned,
      player: { ...warned.player, chrolloBook: { ...warned.player.chrolloBook!, open: false } },
    }
    expect(frames(closed, 1).opponent.crossGame).toBeUndefined()
  })

  it('keeps Dolphin active through the warning and releases it after the single confinement', () => {
    const start = beginFight(createFight('kurapika', 'mizaistom', { mode: 'versus-local' }))
    const state: FightState = {
      ...start,
      player: {
        ...start.player,
        x: 40,
        aura: 100,
        kurapika: {
          ...start.player.kurapika!,
          emperorTime: true,
          held: {
            source: 'mizaistom',
            victim: 'opponent',
            moveId: CROSS_GAME_MOVE,
            loaded: true,
            used: false,
            sustainedKeys: [],
          },
        },
      },
      opponent: {
        ...start.opponent,
        x: 56,
        stolenChainAbility: { owner: 'player', moveId: CROSS_GAME_MOVE },
      },
    }
    const warned = performMove({
      state,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, left: true },
    })
    expect(warned.opponent.crossGame?.phase).toBe('warning')
    expect(warned.player.id).toBe('kurapika')
    expect(dolphinIsBusy(warned, 'player', warned.player.kurapika!.held!)).toBe(true)
    const confined = disobey(frames(warned, 30))
    expect(confined.opponent.crossGame?.phase).toBe('restrained')
    expect(frames(confined, 95).player.kurapika?.held).toBeNull()
  })

  it('resets warning, restraint and card display for the next round', () => {
    const state = nextRound({
      ...disobey(),
      phase: 'finished',
      winner: 'player',
      finishReason: 'knockout',
    })
    expect(state.player.crossGameCardFrames).toBeUndefined()
    expect(state.opponent.crossGame).toBeUndefined()
    expect(state.opponent.hatsuEffects.restrainedFrames).toBe(0)
  })

  it('draws the yellow card then a white lattice cage, and disposes both', () => {
    const scene = new THREE.Scene()
    const effect = createCrossGameScene({ THREE, scene, worldX: (x) => x, worldY: (y) => y })
    effect.sync(warn(), 0)
    expect(scene.children.filter((object) => object.visible)).toHaveLength(1)
    const confined = disobey()
    effect.sync(confined, 0)
    expect(scene.children.filter((object) => object.visible)).toHaveLength(2)
    const cage = scene.children.find(
      (object) => object instanceof THREE.LineSegments && object.visible,
    )!
    expect(cage.position.x).toBe(confined.opponent.x)
    const lattice = cage as THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>
    expect(lattice.name).toBe('cross-game-cage:opponent')
    expect(lattice.geometry.getAttribute('position').count).toBeGreaterThan(200)
    expect(lattice.material.color.getHex()).toBe(0xf1f0e9)
    expect(lattice.material.depthWrite).toBe(false)
    effect.sync(frames(confined, 95), 0)
    expect(scene.children.filter((object) => object.visible)).toHaveLength(0)
    effect.dispose()
    expect(scene.children).toHaveLength(0)
  })
})
