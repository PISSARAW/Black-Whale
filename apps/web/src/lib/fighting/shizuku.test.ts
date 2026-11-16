import { routedFightMove } from './fightMoveSelection'
import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  performMove,
  performAuraAttack,
  tickFight,
  nextRound,
} from './engine'
import { hatsuFor } from './hatsu'
import { activeHitbox, attackData } from './frameData'
import {
  blinkyAvailable,
  blinkyState,
  designateBlinkyTarget,
  exposedBlinkyWounds,
  selectBlinkyCommand,
  plugWoundsInput,
} from './blinky'
import { addChrolloPage, CHROLLO_USE } from './chrolloBook'
import { finisherReady, moveForSlot } from './movesets'
import { buildFightFigure } from './fighterFigure'
import * as THREE from 'three'
import { EMPTY_INPUT, type FightProjectile, type FightSide, type FightState } from './types'

function duel(side: FightSide = 'player'): FightState {
  const state = beginFight(
    createFight(
      side === 'player' ? 'shizuku' : 'hisoka',
      side === 'player' ? 'hisoka' : 'shizuku',
      { mode: 'versus-local', formatId: 'knockout' },
    ),
  )
  return {
    ...state,
    player: { ...state.player, x: 30, aura: 100 },
    opponent: { ...state.opponent, x: 45, aura: 100 },
  }
}
function advance(
  state: FightState,
  frames: number,
  player = EMPTY_INPUT,
  opponent = EMPTY_INPUT,
): FightState {
  for (let i = 0; i < frames; i++)
    state = tickFight(state, player, { dt: 1 / 60, opponentInput: opponent })
  return state
}
function shot(id: number, x: number, rest: Partial<FightProjectile> = {}): FightProjectile {
  return {
    id,
    owner: 'opponent',
    fighterId: 'theta',
    shape: 'bullet',
    matter: 'object',
    colour: '#aaaabb',
    x,
    y: 6.1,
    velocityX: -50,
    width: 0.1,
    height: 0.1,
    damage: 10,
    hitstun: 10,
    blockstun: 5,
    hitstop: 3,
    knockback: 1,
    targetZone: 'torso',
    concealed: false,
    age: 0,
    lifetime: 120,
    ...rest,
  }
}
function active(
  state: FightState,
  side: FightSide = 'player',
  slot = 'neutralSpecial',
): FightState {
  const move = moveForSlot('shizuku', slot as 'neutralSpecial')!
  const started = performAuraAttack({
    state,
    side,
    kind: 'special',
    moveId: move.id,
    auraCharged: false,
  })
  expect(started[side].attack).not.toBeNull()
  return {
    ...started,
    [side]: {
      ...started[side],
      attack: { ...started[side].attack!, frame: attackData('special', started[side]).startup },
    },
  }
}
function blinkyFrame(state: FightState): FightState {
  return hatsuFor('shizuku').onFrame(state)
}

describe('Blinky: named matter, last object and exposed wounds', () => {
  it('waits for startup and has no utility damage hitbox', () => {
    const state = { ...duel(), projectiles: [shot(1, 40)] }
    const start = performMove({ state, side: 'player', action: 'special' })
    expect(start.player.x).toBe(state.player.x)
    expect(blinkyFrame(start).projectiles).toHaveLength(1)
    const running = active(state)
    expect(activeHitbox(running.player)).toBeNull()
    expect(blinkyFrame(running).projectiles).toHaveLength(0)
    const noTargets = advance(performMove({ state: duel(), side: 'player', action: 'special' }), 70)
    expect(noTargets.opponent.health).toBe(duel().opponent.health)
  })

  it.each(['player', 'opponent'] as const)(
    'aims ahead with a height aperture and a named target for %s',
    (side) => {
      let state = duel(side)
      const x = state[side].x
      const facing = state[side].facing
      state = designateBlinkyTarget(state, side, 'bullet')
      state.projectiles = [
        shot(1, x + facing * 7),
        shot(2, x - facing * 7),
        shot(3, x + facing * 7, { y: 18 }),
        shot(4, x + facing * 30),
        shot(5, x + facing * 7, { matter: 'nen' }),
        shot(6, x + facing * 7, { living: true }),
        shot(7, x + facing * 7, { shape: 'card' }),
        shot(8, x + facing * 7, { owner: side }),
      ]
      const result = blinkyFrame(active(state, side))
      expect(result.projectiles.map((p) => p.id)).toEqual([2, 3, 4, 5, 6, 7])
      expect(blinkyState(result[side]).lastObject?.id).toBe(8)
      expect(result[side].health).toBe(state[side].health)
    },
  )

  it('aims down to consume a low stone without erasing a high object', () => {
    const state = designateBlinkyTarget(duel(), 'player', 'stone')
    state.projectiles = [
      shot(1, 40, { shape: 'stone', y: 2 }),
      shot(2, 40, { shape: 'stone', y: 8 }),
    ]
    const result = blinkyFrame(active(state, 'player', 'downSpecial'))
    expect(result.projectiles.map((p) => p.id)).toEqual([2])
  })

  it('returns only the last actual object once, with a fresh identity and no stored Nen buff', () => {
    const state = duel()
    state.projectiles = [
      shot(10, 38),
      shot(11, 40, { damage: 7, shuCharged: true, nenPower: 4, concealed: true }),
    ]
    const swallowed = blinkyFrame(active(state))
    expect(blinkyState(swallowed.player).lastObject?.id).toBe(11)
    const idle = {
      ...swallowed,
      nextProjectileId: 50,
      player: { ...swallowed.player, aura: 100, attack: null },
    }
    const ejecting = active(idle, 'player', 'backSpecial')
    expect(activeHitbox(ejecting.player)).toBeNull()
    const ejected = blinkyFrame(ejecting)
    expect(ejected.projectiles).toHaveLength(1)
    expect(ejected.projectiles[0]).toMatchObject({
      id: 50,
      owner: 'player',
      damage: 7,
      velocityX: 50,
      matter: 'object',
      nenPower: 1,
      hatsuPower: 1,
      shuCharged: false,
      concealed: false,
      age: 0,
    })
    expect(blinkyState(ejected.player).lastObject).toBeUndefined()
    expect(blinkyFrame(ejected).projectiles).toHaveLength(1)
    const empty = { ...ejected, player: { ...ejected.player, attack: null } }
    expect(
      performAuraAttack({
        state: empty,
        side: 'player',
        kind: 'special',
        moveId: 'shizuku:backSpecial',
        auraCharged: false,
      }),
    ).toBe(empty)
    const impact = advance(ejected, 45)
    expect(impact.opponent.health).toBeLessThan(empty.opponent.health)
  })

  it('creates openings only from landed physical vacuum blows, not suction or blocked hits', () => {
    const state = duel()
    state.opponent.x = 37
    const hit = advance(performMove({ state, side: 'player', action: 'light' }), 45)
    expect(hit.opponent.openWounds).toBe(1)
    const guarding = advance(state, 12, EMPTY_INPUT, { ...EMPTY_INPUT, guard: true })
    const blocked = advance(
      performMove({ state: guarding, side: 'player', action: 'light' }),
      45,
      EMPTY_INPUT,
      { ...EMPTY_INPUT, guard: true },
    )
    expect(blocked.opponent.openWounds ?? 0).toBe(0)
    const suction = advance(performMove({ state, side: 'player', action: 'special' }), 70)
    expect(suction.opponent.openWounds ?? 0).toBe(0)
  })

  it('requires uncovered wounds and aim, independently of current HP', () => {
    const state = duel()
    state.opponent.health = 1
    expect(finisherReady(state, 'player')).toBe(false)
    state.opponent.health = duel().opponent.health
    state.opponent.openWounds = 1
    expect(finisherReady(state, 'player')).toBe(true)
    state.opponent.x = 70
    expect(finisherReady(state, 'player')).toBe(false)
    state.opponent.x = 45
    state.opponent.pluggingWounds = true
    expect(finisherReady(state, 'player')).toBe(false)
  })

  it('draws blood without aura drain, healing, hitstun or a generic finisher strike', () => {
    const state = duel()
    state.opponent.openWounds = 2
    state.player.health -= 30
    const running = active(state, 'player', 'finisher')
    expect(activeHitbox(running.player)).toBeNull()
    const result = blinkyFrame(running)
    expect(result.opponent.health).toBe(state.opponent.health - 6)
    expect(result.player.health).toBe(state.player.health)
    expect(result.opponent.aura).toBe(state.opponent.aura)
    expect(result.opponent.hitStun).toBe(0)
  })

  it('lets held wound coverage stop blood loss and reopens on release without healing', () => {
    const state = duel()
    state.opponent.openWounds = 2
    const begun = performMove({ state, side: 'player', action: 'finisher' })
    const covered = advance(begun, 35, EMPTY_INPUT, {
      ...EMPTY_INPUT,
      plugWounds: true,
      guard: true,
    })
    expect(covered.opponent.pluggingWounds).toBe(true)
    expect(covered.opponent.blocking).toBe(false)
    expect(exposedBlinkyWounds(covered.opponent)).toBe(0)
    expect(covered.opponent.health).toBe(state.opponent.health)
    expect(performMove({ state: covered, side: 'opponent', action: 'light' })).toBe(covered)
    const released = advance(covered, 30)
    expect(released.opponent.health).toBeLessThan(covered.opponent.health)
    expect(released.opponent.openWounds).toBe(2)
    const many = { ...state.opponent, openWounds: 3 }
    expect(exposedBlinkyWounds(plugWoundsInput(many, { ...EMPTY_INPUT, plugWounds: true }))).toBe(1)
  })

  it('stops utility effects on interruption and loss of Nen, without resuming an old attack', () => {
    const state = duel()
    state.opponent.openWounds = 1
    const running = active(state, 'player', 'finisher')
    for (const player of [
      { ...running.player, attack: null },
      { ...running.player, nen: { ...running.player.nen, mode: 'zetsu' as const } },
      { ...running.player, hatsuEffects: { ...running.player.hatsuEffects, hatsuStolen: 1 } },
    ]) {
      const stopped = blinkyFrame({ ...running, player })
      expect(stopped.opponent.health).toBe(state.opponent.health)
      expect(stopped.player.hatsuEffects.blinkyFrames).toBe(0)
    }
  })

  it('uses the common death verdict for blood loss and resets wounds/storage each round', () => {
    const state = duel()
    state.opponent.openWounds = 1
    state.opponent.health = 1
    const ended = blinkyFrame(active(state, 'player', 'finisher'))
    expect(ended.winner).toBe('player')
    expect(ended.finishReason).toBe('knockout')
    const next = nextRound(ended)
    expect(next.opponent.openWounds ?? 0).toBe(0)
    expect(next.player.blinky?.lastObject).toBeUndefined()
  })

  it('applies the same selective utility when copied by Chrollo', () => {
    const state = beginFight(createFight('chrollo', 'hisoka', { mode: 'versus-local' }))
    state.player.x = 30
    state.opponent.x = 65
    state.player.chrolloBook = addChrolloPage(state.player.chrolloBook!, 'shizuku')
    state.player.aura = 100
    state.projectiles = [shot(20, 40), shot(21, 40, { matter: 'nen' })]
    const started = performAuraAttack({
      state,
      side: 'player',
      kind: 'special',
      moveId: CHROLLO_USE,
      auraCharged: false,
    })
    const running = {
      ...started,
      player: {
        ...started.player,
        attack: { ...started.player.attack!, frame: attackData('special', started.player).startup },
      },
    }
    expect(activeHitbox(running.player)).toBeNull()
    const swallowed = blinkyFrame(running)
    expect(swallowed.projectiles.map((p) => p.id)).toEqual([21])
    expect(blinkyAvailable(selectBlinkyCommand(swallowed, 'player', 'eject').player)).toBe(true)
  })

  it('replaces an older swallowed object with blood and never retrieves the older object', () => {
    const state = duel()
    state.player.blinky = { target: 'bullet', lastObject: shot(8, 40) }
    state.opponent.openWounds = 1
    const drained = blinkyFrame(active(state, 'player', 'finisher'))
    expect(drained.player.blinky?.lastWasBlood).toBe(true)
    expect(drained.player.blinky?.lastObject).toBeUndefined()
    const idle = { ...drained, player: { ...drained.player, attack: null, aura: 100 } }
    const returned = blinkyFrame(active(idle, 'player', 'backSpecial'))
    expect(returned.projectiles).toHaveLength(0)
    expect(returned.player.blinky?.lastWasBlood).toBe(false)
  })

  it('preserves the chosen Blinky command instead of replacing it with a combo route', () => {
    const low = performMove({ state: duel(), side: 'player', action: 'light', input: { ...EMPTY_INPUT, down: true } })
    for (const slot of ['finisher', 'backSpecial', 'neutralSpecial'] as const) {
      const selected = moveForSlot('shizuku', slot)!
      expect(routedFightMove(low.player, selected)).toBe(selected)
    }
  })

  it('renders a held Blinky while Nen is available', () => {
    const fighter = duel().player
    const figure = buildFightFigure({
      THREE,
      fighter,
      glow: (colour) => new THREE.MeshBasicMaterial({ color: colour }),
    })
    expect(figure.root.getObjectByName('shizuku-blinky')?.parent?.name).toBe('hand-right')
  })
})
