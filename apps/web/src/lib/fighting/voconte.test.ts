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
import { activeHitbox, attackData } from './frameData'
import { futureVisibleState } from './parallelFuturePresentation'
import { FUTURE_PREPARATION_FRAMES } from './parallelFutureTypes'
import { hatsuAvoidsImpact, hatsuDamageFactor } from './hatsu'
import { finisherReady, moveForSlot } from './movesets'
import { toggleEmperorTime } from './kurapikaActions'
import { dolphinIsBusy } from './kurapikaDolphin'
import { createVoconteDoorScene } from './voconteDoorScene'
import {
  advanceVoconteDoors,
  crossedDoor,
  DOOR_FRAMES,
  doorBodyPositions,
  transportDoorBodies,
} from './voconteDoors'
import { voconteAiSlots } from './vocontePresentation'
import { projectHanzo, wakeHanzoBody } from './hanzoProjection'
import {
  EMPTY_INPUT,
  type FightInput,
  type FightSide,
  type FightState,
  type FighterId,
} from './types'

function duel(player: FighterId = 'voconte', opponent: FighterId = 'hisoka'): FightState {
  const state = beginFight(
    createFight(player, opponent, { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 22, aura: 100 },
    opponent: { ...state.opponent, x: 86, aura: 100 },
  }
}

function advance(state: FightState, count: number, input: Partial<FightInput> = {}): FightState {
  for (let frame = 0; frame < count; frame++)
    state = tickFight(
      state,
      { ...EMPTY_INPUT, ...input },
      { dt: 1 / 60, opponentInput: EMPTY_INPUT },
    )
  return state
}

function opened(): FightState {
  return advance(performAttack(duel(), 'player', 'special'), 31)
}

function crossing(
  state: FightState,
  side: FightSide,
  positions: { from: number; to: number; y?: number },
): FightState {
  const origins = {
    ...doorBodyPositions(state),
    [side]: { x: positions.from, y: positions.y ?? 0 },
  }
  return transportDoorBodies({
    ...state,
    [side]: { ...state[side], x: positions.to, y: positions.y ?? 0 },
    voconteDoors: { ...state.voconteDoors!, origins, transported: [] },
  })
}

describe('Voconte — Door, actual directional passage', () => {
  it('connects existing frames after a vulnerable startup, without teleporting or attacking', () => {
    const base = duel()
    const setup = performAttack(base, 'player', 'special')
    expect(setup.player).toMatchObject({ x: 22, aura: 80 })
    expect(setup.voconteDoors?.networks.player).toEqual({ active: false, pending: { open: true } })
    expect(activeHitbox(setup.player)).toBeNull()
    expect(hatsuAvoidsImpact(setup.player)).toBe(false)
    expect(hatsuDamageFactor(setup.player)).toBe(hatsuDamageFactor(base.player))
    const before = advance(setup, 17)
    expect(before.voconteDoors?.networks.player?.active).toBe(false)
    const linked = advance(before, 1)
    expect(linked.voconteDoors?.networks.player?.active).toBe(true)
    expect(linked.player.x).toBe(22)
    expect(linked.opponent.health).toBe(base.opponent.health)
    expect(linked.score).toEqual(base.score)
    expect(activeHitbox(linked.player)).toBeNull()
  })

  it('does not inherit Luini’s visited-room, sealed-room or hideout requirements', () => {
    const state = duel()
    expect(state.environment.stageId).not.toBe('heilly-hideout')
    expect(performAttack(state, 'player', 'special').voconteDoors).toBeDefined()
    expect(moveForSlot('voconte', 'finisher')).toBeNull()
    expect(finisherReady(state, 'player')).toBe(false)
    expect(performMove({ state, side: 'player', action: 'finisher' })).toBe(state)
  })

  it.each(['player', 'opponent'] as const)(
    'transports the actual %s body through A, without damage, stun clearing or evasion',
    (side) => {
      const state = opened()
      const before = { ...state, [side]: { ...state[side], hitStun: 12, blocking: true } }
      const next = crossing(before, side, { from: 29, to: 31 })
      expect(next[side]).toMatchObject({
        x: 72,
        y: 0,
        facing: -1,
        hitStun: 12,
        blocking: true,
        wakeupInvulnerableFrames: 0,
      })
      expect(next[side].health).toBe(state[side].health)
      expect(next[side].aura).toBe(state[side].aura)
      expect(hatsuAvoidsImpact(next[side])).toBe(false)
      expect(next.voconteDoors?.lastTransit?.[side]).toMatchObject({
        from: 'A',
        to: 'B',
        owner: 'player',
      })
      expect(next.projectiles).toBe(state.projectiles)
    },
  )

  it('returns through B with its own arrival orientation and cannot bounce twice in one frame', () => {
    const state = opened()
    const next = crossing(state, 'player', { from: 71, to: 69 })
    expect(next.player).toMatchObject({ x: 32, facing: 1 })
    const second = transportDoorBodies({ ...next, player: { ...next.player, x: 29 } })
    expect(second.player.x).toBe(29)
    expect(second.voconteDoors?.transported).toEqual(['player'])
  })

  it.each([
    { from: 31, to: 29 },
    { from: 30, to: 30 },
    { from: 25, to: 29 },
    { from: 69, to: 71 },
  ])('does nothing for stationary, distant or reverse paths: %j', (path) => {
    expect(crossing(opened(), 'player', path).player.x).toBe(path.to)
  })

  it('requires an active network and a body fitting the threshold', () => {
    const active = opened()
    const inactive = { ...active, voconteDoors: { ...active.voconteDoors!, networks: {} } }
    expect(crossing(inactive, 'player', { from: 29, to: 31 }).player.x).toBe(31)
    expect(crossing(active, 'player', { from: 29, to: 31, y: 8 }).player.x).toBe(31)
    expect(crossing(active, 'player', { from: 29, to: 31, y: 3 }).player.x).toBe(72)
    expect(crossedDoor({ x: 20, y: 0 }, { x: 40, y: 0 }, DOOR_FRAMES[0])).toBe(true)
    expect(crossedDoor({ x: 29, y: 20 }, { x: 31, y: 0 }, DOOR_FRAMES[0])).toBe(false)
  })

  it('walking across an active frame transports on the actual fixed simulation step', () => {
    let state = opened()
    state = { ...state, player: { ...state.player, x: 29.95 } }
    const next = advance(state, 1, { right: true })
    expect(next.player.x).toBe(72)
    expect(next.player.facing).toBe(-1)
    expect(next.voconteDoors?.lastTransit?.player?.from).toBe('A')
    expect(advance(next, 1).player.x).toBe(72)
    expect(advance({ ...state, hitstop: 10 }, 1, { right: true }).player.x).toBe(29.95)
  })

  it('can be hit immediately at the actual arrival position', () => {
    let state = opened()
    state = {
      ...state,
      player: { ...state.player, x: 29.95 },
      opponent: { ...state.opponent, x: 76, facing: -1 },
    }
    state = performAttack(state, 'opponent', 'light')
    state = {
      ...state,
      opponent: {
        ...state.opponent,
        attack: {
          ...state.opponent.attack!,
          frame: attackData('light', state.opponent).startup - 1,
        },
      },
    }
    const next = advance(state, 1, { right: true })
    expect(next.player.health).toBeLessThan(state.player.health)
    expect(next.voconteDoors?.lastTransit?.player?.to).toBe('B')
    expect(next.player.hitStun).toBeGreaterThan(0)
  })

  it.each([
    ['object', 72],
    ['nen', 30.15],
  ] as const)(
    'moves a travelling %s projectile to x=%d: only thrown matter crosses the threshold',
    (matter, expected) => {
      const state: FightState = {
        ...opened(),
        projectiles: [
          {
            id: 1,
            owner: 'player',
            fighterId: 'voconte',
            x: 29.95,
            y: 6,
            velocityX: 12,
            width: 0.3,
            height: 0.3,
            damage: 5,
            hitstun: 2,
            blockstun: 2,
            hitstop: 0,
            knockback: 0,
            targetZone: 'torso',
            shape: 'stone',
            colour: '#ffffff',
            age: 0,
            lifetime: 100,
            matter,
          },
        ],
      }
      const next = advance(state, 1)
      expect(next.projectiles[0].x).toBeCloseTo(expected)
      expect(next.projectiles[0].velocityX).toBe(12)
      expect(next.voconteDoors?.lastTransit).toBeUndefined()
    },
  )

  it('leaves LSDF constructs out of the transported actor bodies', () => {
    const base = opened()
    const state: FightState = {
      ...base,
      lsdf: { opponent: { target: 'player', x: 31, level: 1, phase: 'approaching', exitX: 0 } },
    }
    const next = crossing(state, 'player', { from: 29, to: 31 })
    expect(next.player.x).toBe(72)
    expect(next.lsdf).toBe(state.lsdf)
    expect(next.lsdf?.opponent?.x).toBe(31)
  })

  it('forecasts and displays Door outcomes without changing the actual network or bodies', () => {
    let state = duel('tserriednich', 'voconte')
    state = advance(performAttack(state, 'opponent', 'special'), 31)
    state = { ...state, player: { ...state.player, x: 10 }, opponent: { ...state.opponent, x: 27 } }
    state = advance(performAttack(state, 'player', 'special'), FUTURE_PREPARATION_FRAMES - 1)
    const vision = tickFight(state, EMPTY_INPUT, {
      dt: 1 / 60,
      opponentInput: { ...EMPTY_INPUT, right: true },
    })
    expect(vision.parallelFuture?.phase).toBe('vision')
    expect(vision.voconteDoors?.lastTransit?.opponent).toBeUndefined()
    const index = vision.parallelFuture!.frames.findIndex(
      (frame) => frame.voconteDoors?.lastTransit?.opponent?.from === 'A',
    )
    expect(index).toBeGreaterThan(0)
    const predicted = futureVisibleState(vision, 'player', index)
    expect(predicted.opponent.x).toBe(72)
    expect(predicted.voconteDoors?.lastTransit?.opponent?.to).toBe('B')
    expect(vision.opponent.x).toBeLessThan(30)
    expect(vision.voconteDoors?.networks.opponent?.active).toBe(true)
  })

  it('is interrupted by a real strike during setup', () => {
    const setup = performAttack(duel(), 'player', 'special')
    const attacker = performAttack(
      { ...setup, opponent: { ...setup.opponent, x: 27, facing: -1 } },
      'opponent',
      'light',
    )
    const struck = advance(attacker, 9)
    expect(struck.player.health).toBeLessThan(setup.player.health)
    const recovered = advance(struck, 70)
    expect(recovered.voconteDoors?.networks.player?.active).toBe(false)
    expect(recovered.voconteDoors?.networks.player?.pending).toBeUndefined()
  })

  it('also transports a body knocked through the threshold after collisions', () => {
    let state = opened()
    state = {
      ...state,
      player: { ...state.player, x: 29.5 },
      opponent: { ...state.opponent, x: 24, facing: 1 },
    }
    state = performAttack(state, 'opponent', 'light')
    const next = advance(state, 12)
    expect(next.player.health).toBeLessThan(state.player.health)
    expect(next.player.x).toBe(72)
    expect(next.voconteDoors?.lastTransit?.player).toBeDefined()
  })

  it('does not transport Hanzo’s controlled projection, or fake a crossing when he wakes', () => {
    const state = opened()
    const projected = {
      ...state,
      opponent: { ...projectHanzo({ ...state.opponent, id: 'hanzo', x: 80 }), x: 29 },
    }
    expect(crossing(projected, 'opponent', { from: 29, to: 31 }).opponent.x).toBe(31)
    const origins = doorBodyPositions(projected)
    const woke = transportDoorBodies({
      ...projected,
      opponent: wakeHanzoBody(projected.opponent),
      voconteDoors: { ...state.voconteDoors!, origins, transported: [] },
    })
    expect(woke.opponent.x).toBe(80)
    expect(woke.voconteDoors?.lastTransit?.opponent).toBeUndefined()
  })

  it.each(['zetsu', 'stolen', 'dead', 'exhausted'] as const)(
    'closes the network on %s (duel maintenance convention)',
    (cause) => {
      const state = opened()
      const fighter = { ...state.player }
      if (cause === 'zetsu') fighter.nen = { ...fighter.nen, mode: 'zetsu' }
      if (cause === 'stolen') fighter.hatsuEffects = { ...fighter.hatsuEffects, hatsuStolen: 10 }
      if (cause === 'dead') fighter.health = 0
      if (cause === 'exhausted') fighter.aura = 0
      const next = advanceVoconteDoors({ ...state, player: fighter })
      expect(next.voconteDoors?.networks.player).toBeUndefined()
      expect(crossing(next, 'opponent', { from: 29, to: 31 }).opponent.x).toBe(31)
    },
  )

  it('can close the link without moving anyone and resets between rounds', () => {
    const state = opened()
    const closed = advance(performAttack(state, 'player', 'special'), 18)
    expect(closed.voconteDoors?.networks.player?.active).toBe(false)
    expect(closed.player.x).toBe(state.player.x)
    const next = nextRound({ ...state, phase: 'finished', winner: 'player' })
    expect(next.voconteDoors).toBeUndefined()
  })

  it('uses the same frame rules through Skill Hunter, including loss of its active page', () => {
    const base = duel('chrollo')
    const state = {
      ...base,
      player: {
        ...base.player,
        chrolloBook: { pages: ['voconte'] as const, page: 0, open: true, bookmark: null },
      },
    }
    const linked = advance(performAttack(state, 'player', 'special'), 31)
    expect(linked.player.aura).toBeLessThan(85)
    expect(linked.voconteDoors?.networks.player?.active).toBe(true)
    expect(crossing(linked, 'opponent', { from: 29, to: 31 }).opponent.x).toBe(72)
    const shut = advanceVoconteDoors({
      ...linked,
      player: { ...linked.player, chrolloBook: { ...linked.player.chrolloBook!, open: false } },
    })
    expect(shut.voconteDoors?.networks.player).toBeUndefined()
  })

  it('keeps Dolphin busy until its borrowed network is closed, then returns the actual ability', () => {
    const base = toggleEmperorTime(duel('kurapika', 'voconte'), 'player')
    const held = {
      source: 'voconte' as const,
      victim: 'opponent' as const,
      moveId: 'voconte:neutralSpecial',
      loaded: true,
      used: false,
      sustainedKeys: [],
    }
    const state = {
      ...base,
      player: { ...base.player, kurapika: { ...base.player.kurapika!, held } },
    }
    const cast = performAuraAttack({
      state,
      side: 'player',
      kind: 'special',
      moveId: 'kurapika:backSpecial',
      auraCharged: false,
    })
    const linked = advance(cast, 31)
    expect(linked.player.id).toBe('kurapika')
    expect(linked.voconteDoors?.networks.player?.active).toBe(true)
    expect(dolphinIsBusy(linked, 'player', linked.player.kurapika!.held!)).toBe(true)
    const closing = performAuraAttack({
      state: linked,
      side: 'player',
      kind: 'special',
      moveId: 'kurapika:backSpecial',
      auraCharged: false,
    })
    expect(
      closing.player.kurapika?.held,
      JSON.stringify({ network: closing.voconteDoors, attack: closing.player.attack }),
    ).not.toBeNull()
    expect(closing.voconteDoors?.networks.player?.pending?.open).toBe(false)
    const closed = advance(closing, 31)
    expect(closed.voconteDoors?.networks.player?.active).toBeFalsy()
    expect(closed.player.kurapika?.held).toBeNull()
  })

  it('AI connects once at distance and uses physical attacks after that', () => {
    const state = duel('hisoka', 'voconte')
    expect(voconteAiSlots(state, 40)).toEqual(['neutralSpecial'])
    const connected = performAttack(state, 'opponent', 'special')
    expect(voconteAiSlots(connected, 40)).not.toContain('neutralSpecial')
  })

  it('is immutable and survives a JSON replay', () => {
    const state = opened()
    const frozen = JSON.stringify(state)
    const first = crossing(state, 'opponent', { from: 29, to: 31 })
    const replay = crossing(JSON.parse(frozen), 'opponent', { from: 29, to: 31 })
    expect(replay).toEqual(first)
    expect(JSON.stringify(state)).toBe(frozen)
  })

  it('draws one pair of physical frames per seat and enables only their indicators', () => {
    const scene = new THREE.Scene()
    const effect = createVoconteDoorScene({
      THREE,
      scene,
      worldX: (x) => x / 5,
      worldY: (y) => y / 5,
    })
    const root = scene.getObjectByName('voconte:physical-frames')!
    effect.sync(duel(), 0)
    expect(root.children).toHaveLength(4)
    expect(root.children.filter((frame) => frame.visible)).toHaveLength(2)
    expect(root.visible).toBe(true)
    expect(root.children[0].children[3].visible).toBe(false)
    effect.sync(opened(), 0)
    expect(root.children[0].children[3].visible).toBe(true)
    effect.dispose()
    expect(scene.children).toHaveLength(0)
  })
})
