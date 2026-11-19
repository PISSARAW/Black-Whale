import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, performThrow, tickFight } from './engine'
import { fightReplayHash } from './fightReplayHash'
import { FIGHTING_ROSTER } from './roster'
import { EMPTY_INPUT } from './types'
import type { AttackKind, FightInput, FightMode, FightSide, FightState } from './types'

// Characterization of the duel engine (KAMEOS.md, lot 0). These hashes freeze the
// observable behaviour of tickFight under the current combat rules.
// A refactor must keep them identical; a deliberate combat change re-records them.

const FRAMES = 360
const CHECKPOINT = 60
const ATTACKS: readonly (AttackKind | 'throw')[] = ['light', 'heavy', 'special', 'ranged', 'throw']

function lcg(seed: number) {
  let value = seed >>> 0
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0
    return value / 0x100000000
  }
}

function scriptedInput(roll: () => number): FightInput {
  const r = roll()
  return {
    ...EMPTY_INPUT,
    left: r < 0.2,
    right: r >= 0.2 && r < 0.5,
    jump: roll() < 0.04,
    down: roll() < 0.08,
    guard: roll() < 0.15,
    aura: roll() < 0.1,
    hatsu: roll() < 0.05,
  }
}

function command(state: FightState, side: FightSide, roll: () => number): FightState {
  if (roll() >= 0.06) return state
  const kind = ATTACKS[Math.floor(roll() * ATTACKS.length)]
  return kind === 'throw' ? performThrow(state, side) : performAttack(state, side, kind)
}

interface Run {
  playerId: string
  opponentId: string
  mode: FightMode
  seed: number
}

function characterize(run: Run): string[] {
  const roll = lcg(run.seed)
  let state = beginFight(
    createFight(run.playerId as never, run.opponentId as never, { mode: run.mode }),
  )
  const ai = run.mode === 'versus-ai'
  const hashes: string[] = []
  for (let frame = 1; frame <= FRAMES; frame++) {
    state = command(state, 'player', roll)
    if (!ai) state = command(state, 'opponent', roll)
    const input = scriptedInput(roll)
    const opponentInput = ai ? undefined : scriptedInput(roll)
    state = tickFight(state, input, { dt: 1 / 60, opponentInput, ai })
    if (frame % CHECKPOINT === 0) hashes.push(`${state.phase}:${fightReplayHash(state)}`)
  }
  return hashes
}

const IDS = FIGHTING_ROSTER.map((fighter) => fighter.id)
const PAIRS = IDS.map((id, index) => [id, IDS[(index + 7) % IDS.length]] as const)

describe('duel engine characterization', () => {
  it('stays deterministic for one run', () => {
    const run: Run = { playerId: IDS[0], opponentId: IDS[1], mode: 'versus-ai', seed: 1 }
    expect(characterize(run)).toEqual(characterize(run))
  })

  for (const mode of ['versus-ai', 'versus-local', 'training'] as const) {
    it(`keeps every ${mode} pairing identical`, () => {
      const result = Object.fromEntries(
        PAIRS.map(([playerId, opponentId], index) => [
          `${playerId}-${opponentId}`,
          characterize({ playerId, opponentId, mode, seed: index + 1 }),
        ]),
      )
      expect(result).toMatchSnapshot()
    }, 240_000)
  }
})
