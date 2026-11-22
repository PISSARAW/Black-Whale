import { describe, expect, it } from 'vitest'
import { STAND_FRONT } from '../stands/geometry'
import { NO_DAMAGE } from '../stands/damage'
import { alarm, applyBlast, attachGum, pullGum, shieldedPower, throwSpectator } from './actions'
import { createCrowd, updateSpectator } from './create'
import { crowdInstances, lodCounts } from './lod'
import { stepCrowd, type CrowdContext } from './step'
import type { CrowdState } from './types'
import { REFEREE_ID, createDeathMatchWorld } from '../chrolloPlan/world'

const context = (extra: Partial<CrowdContext> = {}): CrowdContext => ({
  fighters: [],
  focus: { x: 0, y: 0, z: -10 },
  damage: NO_DAMAGE,
  rescue: false,
  ...extra,
})

function run(crowd: CrowdState, frames: number, extra: Partial<CrowdContext> = {}): CrowdState {
  let next = crowd
  for (let frame = 0; frame < frames; frame += 1) next = stepCrowd(next, context(extra))
  return next
}

describe('simulated crowd', () => {
  it('seats the same real people on every visit', () => {
    const a = createCrowd({ count: 260, seed: 7 })
    const b = createCrowd({ count: 260, seed: 7 })
    expect(a.spectators).toHaveLength(260)
    expect(a.spectators.map((spectator) => spectator.seat)).toEqual(
      b.spectators.map((spectator) => spectator.seat),
    )
    expect(new Set(a.spectators.map((spectator) => spectator.nature))).toEqual(new Set(['human']))
  })

  it('panics near an alarm and empties the hall through the exits', () => {
    const crowd = alarm(createCrowd({ count: 120 }), { x: 0, y: 0, z: -12 }, 4)
    const after = run(crowd, 60 * 60)
    const evacuated = after.spectators.filter(
      (spectator) => spectator.posture === 'evacuated',
    ).length
    expect(evacuated).toBeGreaterThan(100)
  })

  it('kills inside a blast core, throws the rest and leaves bodies on the ground', () => {
    const crowd = createCrowd({ count: 260 })
    const victim = crowd.spectators[0]
    const struck = applyBlast(crowd, { at: victim.at, power: 3 })
    expect(struck.spectators[0].posture).toBe('dead')
    expect(struck.spectators.some((spectator) => spectator.posture === 'airborne')).toBe(true)
    const settled = run(struck, 240)
    expect(settled.spectators[0].posture).toBe('dead')
    expect(settled.spectators.filter((spectator) => spectator.posture === 'airborne')).toHaveLength(
      0,
    )
  })

  it('lets the rescue teams carry the bodies out', () => {
    const crowd = createCrowd({ count: 60 })
    const dead = updateSpectator(crowd, 's0', (spectator) => ({
      ...spectator,
      posture: 'dead',
      health: 0,
    }))
    const rescued = run(dead, 100, { rescue: true })
    expect(rescued.spectators[0].posture).toBe('evacuated')
  })

  it('falls into the pit when thrown and is hurt by the landing', () => {
    const crowd = createCrowd({ count: 260 })
    const front = crowd.spectators.findIndex((spectator) => spectator.seat.z === -9)
    const thrown = throwSpectator(crowd, `s${front}`, { x: 0, y: 4, z: 6 })
    const landed = run(thrown, 180)
    const body = landed.spectators[front]
    expect(body.at.z).toBeGreaterThan(STAND_FRONT)
    expect(['injured', 'dead']).toContain(body.posture)
  })

  it('holds a body on Bungee Gum, then pulls it toward the anchor', () => {
    const crowd = attachGum(createCrowd({ count: 30 }), 's2')
    expect(crowd.spectators[2].posture).toBe('held')
    const pulled = pullGum(crowd, 's2', { x: 0, y: 0, z: 0.3 })
    expect(pulled.spectators[2].posture).toBe('airborne')
    expect(pulled.spectators[2].velocity.z).toBeGreaterThan(0)
  })

  it('shields a target behind ordinary bodies', () => {
    const crowd = createCrowd({ count: 260 })
    const blast = { at: { x: -20, y: 0.15, z: -9 }, power: 3 }
    expect(shieldedPower(crowd, blast, { x: 20, y: 0.15, z: -9 })).toBeLessThan(3)
  })

  it('keeps the nature out of what the renderer sees and splits bodies by detail level', () => {
    const crowd = createCrowd({ count: 260 })
    expect(Object.keys(crowdInstances(crowd)[0])).not.toContain('nature')
    const counts = lodCounts(crowd, { x: 0, y: 0, z: -10 })
    expect(counts.near + counts.mid + counts.far).toBe(260)
    expect(counts.near).toBeGreaterThan(0)
    expect(counts.far).toBeGreaterThan(0)
  })

  it('flags the referee apart from the anonymous crowd', () => {
    const { crowd } = createDeathMatchWorld()
    const referee = crowdInstances(crowd).find((instance) => instance.id === REFEREE_ID)
    expect(referee?.referee).toBe(true)
    expect(referee?.character).toBeNull()
  })

  it('flags the character a crowd body stands for', () => {
    const crowd = createCrowd({ count: 20 })
    const copy = updateSpectator(crowd, 's0', (spectator) => ({
      ...spectator,
      nature: 'copy',
      copyOf: 's0',
    }))
    expect(crowdInstances(copy).find((instance) => instance.id === 's0')?.character).toBe('hisoka')
    const chrollo = updateSpectator(crowd, 's1', (spectator) => ({ ...spectator, face: 'chrollo' }))
    expect(crowdInstances(chrollo).find((instance) => instance.id === 's1')?.character).toBe(
      'chrollo-lucilfer',
    )
    const human = crowdInstances(crowd).find((instance) => instance.id === 's2')
    expect(human?.character).toBeNull()
  })

  it('steps 300 bodies in panic fast enough for a frame', () => {
    const crowd = alarm(createCrowd({ count: 300 }), { x: 0, y: 0, z: -12 }, 2)
    const start = performance.now()
    run(crowd, 300)
    expect((performance.now() - start) / 300).toBeLessThan(8)
  })
})
