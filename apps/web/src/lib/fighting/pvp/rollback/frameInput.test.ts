import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from '../../engine'
import { fightReplayHash } from '../../fightReplayHash'
import { packReplayInput } from '../../fightReplayInput'
import { ROSTER_TECHNIQUES } from '../../rosterTechniqueDirection'
import { AuthoritativeClashMatch } from '../serverMatch'
import { IDLE_SEAT, stepPvpFrame, type PvpFrameInput, type PvpSeatFrame } from './frameInput'
import { EMPTY_INPUT, type FightState, type FighterId } from '../../types'
import type { PvpCommand } from '../types'

const ROSTER = Object.keys(ROSTER_TECHNIQUES) as FighterId[]
const FRAMES = 300

function duel(player: FighterId, opponent: FighterId): FightState {
  return beginFight(createFight(player, opponent, { mode: 'versus-local', formatId: 'knockout' }))
}

/** Held controls that change every few frames, plus moves and speech through panel commands. */
function seat(frame: number, index: number): PvpSeatFrame {
  const r = (Math.floor(frame / 7) * 7919 + index * 104729) % 97
  const input = packReplayInput({
    ...EMPTY_INPUT,
    left: r < 25,
    right: r > 70,
    down: r % 5 === 0,
    guard: r % 6 === 0,
    jump: frame % 53 === index * 11,
    aura: r % 9 === 0,
  })
  const commands: PvpCommand[] = []
  if (frame % 40 === index * 13) commands.push({ kind: 'move', action: 'light', input })
  if (frame % 90 === index * 30 + 5) commands.push({ kind: 'move', action: 'special', input })
  if (frame % 120 === 60) commands.push({ kind: 'talk', words: 'Encore.' })
  return { input, commands }
}

const frames: PvpFrameInput[] = Array.from({ length: FRAMES }, (_, frame) => ({
  player: seat(frame, 0),
  opponent: seat(frame, 1),
}))

function run(initial: FightState, inputs: readonly PvpFrameInput[]) {
  const hashes: string[] = []
  let state = initial
  for (const [frame, input] of inputs.entries()) {
    state = stepPvpFrame(state, input)
    if (frame % 30 === 29) hashes.push(fightReplayHash(state))
  }
  return { state, hashes }
}

/** The referee fed one packet per seat and frame, as a perfectly regular network would. */
function referee(initial: FightState, inputs: readonly PvpFrameInput[]) {
  const match = new AuthoritativeClashMatch(initial)
  const hashes: string[] = []
  for (const [frame, input] of inputs.entries()) {
    const now = (frame * 1000) / 60
    for (const side of ['player', 'opponent'] as const)
      match.submit(
        side,
        { sequence: frame, input: input[side].input, commands: [...input[side].commands] },
        now,
      )
    match.advance(now)
    if (frame % 30 === 29) hashes.push(fightReplayHash(match.snapshot()))
  }
  return hashes
}

describe('PvP frame input (rollback lot L1)', () => {
  it.each(ROSTER.map((id, index) => [id, ROSTER[(index + 7) % ROSTER.length]] as const))(
    '%s against %s: two simulations and the referee agree on every checkpoint',
    (player, opponent) => {
      const first = run(duel(player, opponent), frames)
      const second = run(duel(player, opponent), frames)
      expect(second.hashes).toEqual(first.hashes)
      expect(referee(duel(player, opponent), frames)).toEqual(first.hashes)
    },
  )

  it('resolves place 1 before place 2 within a frame', () => {
    const light = { kind: 'move', action: 'light', input: 0 } as const
    const both = {
      player: { input: 0, commands: [light] },
      opponent: { input: 0, commands: [light] },
    }
    const initial = duel('kurapika', 'kurapika')
    const close = {
      ...initial,
      player: { ...initial.player, x: 44 },
      opponent: { ...initial.opponent, x: 50 },
    }
    let state = stepPvpFrame(close, both)
    for (let frame = 0; frame < 30; frame++)
      state = stepPvpFrame(state, { player: IDLE_SEAT, opponent: IDLE_SEAT })
    expect(state.player.health).toBeLessThan(state.player.maxHealth)
    expect(state.opponent.health).toBeLessThan(state.opponent.maxHealth)
  })

  it('treats an idle seat like an empty packet', () => {
    const initial = duel('hisoka', 'chrollo')
    const idle = { player: IDLE_SEAT, opponent: IDLE_SEAT }
    const empty = { player: { input: 0, commands: [] }, opponent: { input: 0, commands: [] } }
    expect(fightReplayHash(stepPvpFrame(initial, idle))).toBe(
      fightReplayHash(stepPvpFrame(initial, empty)),
    )
  })
})
