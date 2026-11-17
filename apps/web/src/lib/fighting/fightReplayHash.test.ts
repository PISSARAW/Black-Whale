import { describe, expect, it } from 'vitest'
import { createFight } from './engine'
import { fightReplayHash } from './fightReplayHash'
import { immutableFightSnapshot, immutableSnapshotDigest } from './immutableFightSnapshot'
import type { FightState } from './types'

/** The previous on-disk replay algorithm: an independent compatibility oracle. */
function legacyCanonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(legacyCanonical).join(',')}]`
  if (!value || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  const object = value as Record<string, unknown>
  return `{${Object.keys(object)
    .filter((key) => object[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${legacyCanonical(object[key])}`)
    .join(',')}}`
}

function legacyHash(state: ReturnType<typeof createFight>) {
  const text = legacyCanonical(state)
  let hash = 2166136261
  for (let index = 0; index < text.length; index++)
    hash = Math.imul(hash ^ text.charCodeAt(index), 16777619)
  return (hash >>> 0).toString(16).padStart(8, '0')
}

describe('replay hash shared subtree reuse', () => {
  it('reuses only certified immutable forecasts and preserves the legacy hash for every prefix', () => {
    const state = createFight('tserriednich', 'chrollo')
    const frames = immutableFightSnapshot(
      Array.from({ length: 600 }, () => ({
        player: state.player,
        opponent: state.opponent,
        projectiles: state.projectiles,
        impact: state.impact,
        phase: state.phase,
        time: state.time,
        rng: state.rng,
        command: null,
      })),
    )
    const future: FightState = {
      ...state,
      parallelFuture: {
        owner: 'player',
        phase: 'vision',
        preparation: 30,
        cursor: 0,
        previewCursor: 0,
        frames,
        controls: null,
      },
    }
    expect(fightReplayHash(future)).toBe(legacyHash(future))
    future.parallelFuture!.previewCursor = 10
    expect(fightReplayHash(future)).toBe(legacyHash(future))
    expect(immutableSnapshotDigest(frames)!.hashes.size).toBe(1)
    future.rng++
    future.parallelFuture!.cursor++
    expect(fightReplayHash(future)).toBe(legacyHash(future))
    expect(Object.isFrozen(state.player)).toBe(false)
    expect(Object.isFrozen(frames[0].player)).toBe(true)
    expect(() => {
      frames[0].player.health--
    }).toThrow(TypeError)
  })

  it('does not cache imported mutable forecasts or sparse-array contents across calls', () => {
    const state = createFight('tserriednich', 'chrollo')
    const frame = {
      player: state.player,
      opponent: state.opponent,
      projectiles: state.projectiles,
      impact: state.impact,
      phase: state.phase,
      time: state.time,
      rng: state.rng,
      command: null,
    }
    const future: FightState = {
      ...state,
      parallelFuture: {
        owner: 'player',
        phase: 'vision',
        preparation: 30,
        cursor: 0,
        previewCursor: 0,
        frames: [frame],
        controls: null,
      },
    }
    const sparse = new Array(4)
    sparse[1] = undefined
    sparse[2] = 'end'
    const input = Object.assign(future, { hashProbe: sparse })
    expect(fightReplayHash(input)).toBe(legacyHash(input))
    frame.player.health--
    expect(fightReplayHash(input)).toBe(legacyHash(input))
    expect(immutableSnapshotDigest(future.parallelFuture!.frames)).toBeUndefined()
  })
  it('keeps the exact legacy fingerprint for a large shared snapshot graph', () => {
    const state = createFight('tserriednich', 'chrollo')
    const shared = {
      z: 'quoted "value"\n',
      a: [null, true, undefined, -0, 1.25],
      absent: undefined,
    }
    const input = Object.assign(state, {
      hashProbe: Array.from({ length: 600 }, () => ({ shared, fighter: state.player })),
    })
    expect(fightReplayHash(input)).toBe(legacyHash(input))
  })

  it('detects mutations between calls even when the same graph identity is reused', () => {
    const state = createFight('tserriednich', 'chrollo')
    const first = fightReplayHash(state)
    state.player.health--
    expect(fightReplayHash(state)).not.toBe(first)
    expect(fightReplayHash(state)).toBe(legacyHash(state))
  })
})
