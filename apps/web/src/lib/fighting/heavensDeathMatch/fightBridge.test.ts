import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, opponentAttack, tickFight } from '../engine'
import { FIXED_STEP } from '../fightClock'
import { createFightEnvironment } from '../fightEnvironment'
import { EMPTY_INPUT, type FightState } from '../types'
import { withKameos } from '../kameos/state'
import { chrolloInStands, deathMatchBodyPosition, hallToLane, laneToHall } from './fightBridge'
import { duelFormat, historicalEnvironment, historicalSeats } from './historicalSetup'
import { DEATH_MATCH_FORMAT } from './loadout'
import { parseDeathMatchOptions } from './optionsCodec'
import { buildCrowdScene } from './render/crowdScene'
import { createCrowd } from './crowd/create'
import { decapitate } from './crowd/heads'

function historicalFight(chrolloSide: 'player' | 'opponent' = 'opponent'): FightState {
  const seats = historicalSeats(chrolloSide)
  const environment = historicalEnvironment(createFightEnvironment(), {
    chrolloSide,
    playMode: 'scripted',
  })
  return beginFight(
    createFight(seats.player, seats.opponent, { formatId: DEATH_MATCH_FORMAT, environment }),
  )
}

function run(state: FightState, frames: number): FightState {
  let next = state
  for (let frame = 0; frame < frames; frame += 1)
    next = tickFight(next, EMPTY_INPUT, { dt: FIXED_STEP, ai: true })
  return next
}

describe('the death match inside the duel', () => {
  it('converts the lane to the hall and back', () => {
    const at = laneToHall({ x: 80, y: 10 })
    expect(at.z).toBe(0)
    const lane = hallToLane(at)
    expect(lane.x).toBeCloseTo(80)
    expect(lane.y).toBeCloseTo(10)
  })

  it('creates the hall, the crowd and the scenario with the fight', () => {
    const state = historicalFight()
    expect(state.deathMatch?.crowd.spectators.length).toBeGreaterThan(200)
    expect(state.deathMatch?.scenario.options.playMode).toBe('scripted')
    expect(createFight('hisoka', 'chrollo').deathMatch).toBeUndefined()
  })

  it('steps the world with every frame of the duel', () => {
    const state = run(historicalFight(), 60 * 4)
    expect(state.deathMatch?.crowd.frame).toBe(60 * 4)
    expect(state.deathMatch?.scenario.done).toContain('referee-marked-black-voice')
  })

  it('leaves the opponent to the historical plan instead of the generic Ken AI', () => {
    const state = historicalFight()
    expect(opponentAttack(state)).toBe(state)
    let next = state
    let chrolloAttacked = false
    for (let frame = 0; frame < 60 * 12 && !chrolloAttacked; frame += 1) {
      next = tickFight(next, EMPTY_INPUT, {
        dt: FIXED_STEP,
        ai: true,
        onFrame: (_before, after) => {
          chrolloAttacked ||= after.opponent.attack !== null
        },
      })
    }
    expect(chrolloAttacked).toBe(true)
    expect(next.deathMatch?.scenario.done).toContain('chrollo-feint-kick-flurry')
  })

  it('marks the referee before Hisoka cuts him and reaches the first explosion', () => {
    const state = run(historicalFight(), 60 * 20)
    const referee = state.deathMatch?.crowd.spectators.find((body) => body.id === 'referee')
    expect(state.deathMatch?.scenario.done).toContain('first-explosion')
    expect(referee?.cause).toBe('blast')
  })

  it('drops ordinary lobby kameos from the historical reconstruction', () => {
    const seats = historicalSeats('opponent')
    const environment = historicalEnvironment(createFightEnvironment())
    const state = createFight(seats.player, seats.opponent, {
      formatId: DEATH_MATCH_FORMAT,
      environment,
    })
    expect(withKameos(state, { opponent: 'luzurus' }).kameos).toBeUndefined()
  })

  it('finishes the historical fight in the real duel engine after the body pile', () => {
    let state = historicalFight()
    for (let frame = 0; frame < 60 * 240 && state.phase === 'fighting'; frame += 1)
      state = tickFight(state, EMPTY_INPUT, { dt: FIXED_STEP, ai: true })
    expect(state.deathMatch?.scenario.done).toContain('hisoka-buried')
    expect(state.deathMatch?.scenario.done).toContain('hisoka-asphyxiated')
    expect(state.deathMatch?.scenario.done).toContain('machi-bound')
    expect(state.phase).toBe('finished')
  })

  it('takes Chrollo into the stands, out of reach on the lane and drawn where he stands', () => {
    let state = historicalFight()
    for (let frame = 0; frame < 60 * 30 && !chrolloInStands(state.deathMatch!); frame += 60)
      state = run(state, 60)
    const world = state.deathMatch!
    expect(chrolloInStands(world)).toBe(true)
    expect(state.opponent.wakeupInvulnerableFrames).toBeGreaterThan(0)
    expect(state.opponent.x).toBeGreaterThanOrEqual(0)
    expect(state.opponent.x).toBeLessThanOrEqual(100)
    const drawn = deathMatchBodyPosition(state, 'opponent', { x: state.opponent.x, y: 0 })
    expect(drawn.z).toBeCloseTo(world.chrollo.at.z)
    const hisokaDrawn = deathMatchBodyPosition(state, 'player', { x: 10, y: 0 })
    expect(hisokaDrawn.z).toBeCloseTo(world.hisoka.at.z)
  })

  it('follows the chosen side', () => {
    const state = historicalFight('player')
    expect(state.player.id).toBe('chrollo')
    expect(state.deathMatch?.scenario.options.chrolloSide).toBe('player')
  })
})

describe('the historical setup', () => {
  it('reads replayed options and rejects malformed ones', () => {
    expect(parseDeathMatchOptions(undefined)).toBeUndefined()
    expect(parseDeathMatchOptions({ playMode: 'free', chrolloSide: 'player' })).toEqual({
      playMode: 'free',
      chrolloSide: 'player',
    })
    expect(parseDeathMatchOptions({ playMode: 'replay' })).toBeNull()
  })

  it('places the fight in the Tower and gives a duel its format back', () => {
    expect(historicalEnvironment(createFightEnvironment()).stageId).toBe('heavens-arena')
    expect(duelFormat(DEATH_MATCH_FORMAT)).not.toBe(DEATH_MATCH_FORMAT)
    expect(duelFormat('knockout')).toBe('knockout')
  })
})

describe('the drawn crowd', () => {
  const kit = {
    THREE,
    glow: (colour: number, opacity: number) =>
      new THREE.MeshBasicMaterial({ color: colour, opacity, transparent: opacity < 1 }),
    geometry: <T extends THREE.BufferGeometry>(geometry: T) => geometry,
  }

  it('draws one body and one head per present spectator', () => {
    const scene = buildCrowdScene(kit as never, 400)
    const crowd = createCrowd({ count: 20 })
    scene.sync(crowd)
    expect(scene.root.children).toHaveLength(21) // one head instance and one figure per spectator
    const gone = {
      ...crowd,
      spectators: crowd.spectators.map((spectator, index) =>
        index < 5 ? { ...spectator, posture: 'evacuated' as const } : spectator,
      ),
    }
    scene.sync(gone)
    expect(scene.root.children).toHaveLength(21)
    expect(scene.root.children.slice(1, 6).every((body) => !body.visible)).toBe(true)
    scene.sync(crowd)
    expect(scene.root.children.slice(1).every((body) => body.visible)).toBe(true)
  })

  it('updates the pose of a body already drawn in the scene', () => {
    const scene = buildCrowdScene(kit as never, 10)
    const crowd = createCrowd({ count: 1 })
    scene.sync(crowd)
    const body = scene.root.children[1]
    const pose = () => {
      const rotations: unknown[] = []
      body.traverse((node) => rotations.push(node.rotation.toArray()))
      return rotations
    }
    const seated = pose()
    scene.sync({
      ...crowd,
      spectators: crowd.spectators.map((spectator) => ({ ...spectator, posture: 'dead' })),
    })
    expect(scene.root.children[1]).toBe(body)
    expect(pose()).not.toEqual(seated)
  })

  it('moves a severed head off its body without changing the instance budget', () => {
    const scene = buildCrowdScene(kit as never, 400)
    const crowd = createCrowd({ count: 20 })
    scene.sync(decapitate(crowd, crowd.spectators[0].id))
    const heads = scene.root.children[0] as THREE.InstancedMesh
    expect(heads).toBeInstanceOf(THREE.InstancedMesh)
    expect(heads.count).toBe(1)
  })
})
