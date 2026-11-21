import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { createFightEnvironment } from './fightEnvironment'
import { advanceProjectiles } from './projectiles'
import { parsePvpSetup } from './pvp/protocol'
import {
  DEFAULT_DOOR_PICK,
  DOOR_FRAMES,
  doorFramesFor,
  doorPickSites,
  doorSitesFor,
  parseDoorFramePicks,
} from './voconteDoorSites'
import { passProjectileThroughDoor } from './voconteDoorProjectiles'
import { doorBodyPositions, transportDoorBodies } from './voconteDoors'
import type { DoorFramePick } from './voconteDoorTypes'
import type { FightProjectile, FightSide, FightState } from './types'

function linked(pick?: DoorFramePick, stageId: 'whale-hold' | 'heavens-arena' = 'whale-hold') {
  const fight = createFight('voconte', 'hisoka', {
    mode: 'versus-local',
    formatId: 'knockout',
    environment: createFightEnvironment({
      stageId,
      ...(pick ? { doorFrames: { player: pick } } : {}),
    }),
  })
  const state = beginFight(fight)
  return {
    ...state,
    player: { ...state.player, x: 40, aura: 100 },
    opponent: { ...state.opponent, x: 60, aura: 100 },
    voconteDoors: { networks: { player: { active: true } }, transported: [] },
  } satisfies FightState
}

function walk(state: FightState, side: FightSide, path: { from: number; to: number }) {
  return transportDoorBodies({
    ...state,
    [side]: { ...state[side], x: path.to, y: 0 },
    voconteDoors: {
      ...state.voconteDoors!,
      origins: { ...doorBodyPositions(state), [side]: { x: path.from, y: 0 } },
      transported: [],
    },
  })
}

function shot(overrides: Partial<FightProjectile> = {}): FightProjectile {
  return {
    id: 1,
    owner: 'player',
    fighterId: 'voconte',
    x: 11,
    y: 6,
    velocityX: 60,
    width: 0.5,
    height: 0.3,
    damage: 8,
    hitstun: 10,
    blockstun: 8,
    hitstop: 4,
    knockback: 2,
    targetZone: 'torso',
    shape: 'bullet',
    colour: '#ccc',
    age: 0,
    lifetime: 120,
    matter: 'object',
    ...overrides,
  } as FightProjectile
}

describe('Voconte — Door frames chosen before the round', () => {
  it('keeps the historic 30/70 pair when nothing is chosen', () => {
    expect(doorFramesFor(linked(), 'player')).toBe(DOOR_FRAMES)
    expect(doorPickSites('whale-hold', DEFAULT_DOOR_PICK)?.map((s) => s.x)).toEqual([30, 70])
  })

  it('links only real frames of this level, distinct and far enough apart', () => {
    expect(doorPickSites('whale-hold', ['port-hatch', 'starboard-hatch'])).not.toBeNull()
    expect(doorPickSites('whale-hold', ['cargo-door', 'cargo-door'])).toBeNull()
    expect(doorPickSites('heavens-arena', ['west-gate', 'inner-left'])).toBeNull()
    expect(doorPickSites('whale-hold', ['west-gate', 'inner-right'])).toBeNull()
    expect(doorSitesFor('heavens-arena').some((site) => site.id === 'west-gate')).toBe(true)
  })

  it('orders the pair so A is the left frame whatever the selection order', () => {
    const frames = doorFramesFor(linked(['starboard-hatch', 'port-hatch']), 'player')
    expect(frames.map(({ id, x, direction }) => ({ id, x, direction }))).toEqual([
      { id: 'A', x: 10, direction: 1 },
      { id: 'B', x: 90, direction: -1 },
    ])
  })

  it('falls back to the default frames for an invalid pick instead of opening anywhere', () => {
    expect(doorFramesFor(linked(['inner-left', 'inner-left']), 'player')).toBe(DOOR_FRAMES)
  })

  it('retreats a body through the chosen frames only', () => {
    const state = linked(['port-hatch', 'cargo-door'])
    const retreat = walk(state, 'player', { from: 9, to: 11 })
    expect(retreat.player.x).toBe(52)
    expect(retreat.voconteDoors?.lastTransit?.player).toMatchObject({ from: 'A', to: 'B' })
    expect(walk(state, 'player', { from: 29, to: 31 }).player.x).toBe(31)
  })

  it('lets the opponent use the owner’s open frames, as the threshold belongs to the level', () => {
    const state = linked(['port-hatch', 'cargo-door'])
    const next = walk(state, 'opponent', { from: 51, to: 49 })
    expect(next.opponent.x).toBe(12)
    expect(next.voconteDoors?.lastTransit?.opponent?.owner).toBe('player')
  })
})

describe('Voconte — projectiles physically crossing a frame', () => {
  const state = linked(['port-hatch', 'cargo-door'])

  it('carries a thrown object across, keeping speed and heading, skipping the world between', () => {
    const step = passProjectileThroughDoor(state, { projectile: shot(), previousX: 9 })
    expect(step.projectile).toMatchObject({ x: 52, velocityX: 60 })
    expect(step.previousX).toBe(50)
  })

  it('returns a leftward shot through B onto the far side of A', () => {
    const step = passProjectileThroughDoor(state, {
      projectile: shot({ x: 49, velocityX: -60 }),
      previousX: 51,
    })
    expect(step.projectile.x).toBe(8)
  })

  it.each([
    ['emitted aura', { matter: 'nen' as const }, 9],
    ['a shot above the lintel', { y: 13.9 }, 9],
    ['a reverse crossing', { x: 9, velocityX: -60 }, 11],
  ] as const)('refuses %s', (_, overrides, previousX) => {
    const projectile = shot(overrides)
    expect(passProjectileThroughDoor(state, { projectile, previousX }).projectile).toBe(projectile)
  })

  it('does nothing while the network is closed', () => {
    const closed = { ...state, voconteDoors: { networks: {}, transported: [] } }
    const projectile = shot()
    expect(passProjectileThroughDoor(closed, { projectile, previousX: 9 }).projectile).toBe(
      projectile,
    )
  })

  it('runs inside the ordinary projectile step', () => {
    const fired = { ...state, projectiles: [shot({ x: 9.5 })] }
    const next = advanceProjectiles(fired, 1 / 60)
    expect(next.state.projectiles[0]?.x).toBeCloseTo(52)
  })
})

describe('Voconte — door picks on the wire', () => {
  it('round-trips a pick through the private match setup', () => {
    const environment = createFightEnvironment({
      doorFrames: { player: ['port-hatch', 'cargo-door'] },
    })
    const setup = { player: 'voconte', opponent: 'hisoka', formatId: 'knockout', environment }
    expect(parsePvpSetup(setup)?.environment.doorFrames).toEqual(environment.doorFrames)
  })

  it('rejects malformed picks', () => {
    expect(parseDoorFramePicks({ referee: ['a', 'b'] })).toBeNull()
    expect(parseDoorFramePicks({ player: ['a'] })).toBeNull()
    expect(parseDoorFramePicks(undefined)).toBeUndefined()
  })
})
