import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { fightReplayHash } from './fightReplayHash'
import { parsePvpPacket } from './pvp/protocol'
import { illumiDisguiseAi } from './illumiDisguiseAi'
import { applyAuraContext } from './nen'
import { EMPTY_INPUT, type FightState } from './types'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { ReplayPacket } from './fightReplayTypes'

const command = (state: FightState, command: ArsenalCommand) =>
  performArsenalAction({ state, side: 'opponent', command }, performAuraAttack)
function setup(pinned = false): FightState {
  const state = beginFight(
    createFight('hisoka', 'illumi', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { needleStock: { opponent: pinned } },
    }),
  )
  return { ...state, opponent: { ...state.opponent, aura: 100 } }
}
function frames(state: FightState, count = 35): FightState {
  for (let frame = 0; frame < count; frame++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
describe('the real Illumi disguise controls in replays, AI and On', () => {
  it('records and reproduces P2’s physical pins, removal, unpinned choice, alteration and reversion', () => {
    let state = setup(true)
    const recorder = createReplayRecorder(state)!
    const plan: Record<number, ArsenalCommand> = {
      0: { action: 'illumi-face-mode', target: 'pinned-gittarackur' },
      1: { action: 'illumi-face-apply' },
      40: { action: 'illumi-face-remove' },
      41: { action: 'illumi-face-mode', target: 'unpinned-hisoka' },
      42: { action: 'illumi-face-apply' },
      80: { action: 'illumi-face-apply' },
    }
    for (let frame = 0; frame < 100; frame++) {
      const action = plan[frame]
      const preview = action ? command(state, action) : state
      if (action) expect(preview).not.toBe(state)
      const packet: ReplayPacket = [
        1 / 60,
        0,
        0,
        action ? [panelReplayCommand(state, preview)] : [],
      ]
      const next = executeReplayPacket(state, packet)
      recorder.append(state, packet, next)
      state = next
      if (frame === 35)
        expect(state.opponent.illumi).toMatchObject({
          disguised: true,
          disguiseMode: 'pinned-gittarackur',
        })
      if (frame === 75)
        expect(state.opponent.illumi).toMatchObject({
          disguised: true,
          disguiseMode: 'unpinned-hisoka',
        })
    }
    const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
    for (let step = 0; step < 100 && !replay.done; step++) replay.advance(0.05, 2)
    expect(replay.error).toBe('')
    expect(replay.done).toBe(true)
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
  })
  it('does not turn the unpinned application into free physical ammunition', () => {
    let state = command(setup(), { action: 'illumi-face-mode', target: 'unpinned-hisoka' })
    state = frames(command(state, { action: 'illumi-face-apply' }))
    expect(
      performAuraAttack({
        state,
        side: 'opponent',
        kind: 'special',
        moveId: 'illumi:neutralSpecial',
        auraCharged: false,
      }),
    ).toBe(state)
    expect(state.player.needlePuppet).toBeUndefined()
  })
  it('uses the same two real commands for an AI with no needles and leaves its prepared form alone', () => {
    let state = setup()
    state = illumiDisguiseAi(state, performAuraAttack)!
    expect(state.opponent.illumiDisguisePlan).toBe('unpinned-hisoka')
    state = illumiDisguiseAi(state, performAuraAttack)!
    expect(state.opponent.illumi?.preparation).toBe(30)
    state = frames(state)
    expect(state.opponent.illumi?.disguised).toBe(true)
    expect(illumiDisguiseAi(state, performAuraAttack)).toBeNull()
  })
  it('keeps On, rejects a fresh face alteration and permits physical pin removal without using Nen', () => {
    let state = frames(command(setup(true), { action: 'illumi-face-apply' }))
    state = {
      ...state,
      opponent: applyAuraContext(
        { ...state.opponent, on: { grudge: 100, sealFrames: 0 } },
        { ...EMPTY_INPUT, aura: true, hatsu: true },
      ),
    }
    expect(state.opponent.nen.on).toBe(true)
    state = command(state, { action: 'illumi-face-remove' })
    expect(state.opponent.illumi?.disguised).toBe(false)
    expect(state.opponent.nen.on).toBe(true)
    expect(command(state, { action: 'illumi-face-apply' })).toBe(state)
  })
  it('accepts semantic choices and rejects a client-provided face state', () => {
    const packet = {
      sequence: 0,
      input: 0,
      commands: [
        { kind: 'arsenal', command: { action: 'illumi-face-mode', target: 'unpinned-hisoka' } },
      ],
    }
    expect(parsePvpPacket(packet)).toEqual(packet)
    expect(
      parsePvpPacket({
        ...packet,
        commands: [
          { kind: 'arsenal', command: { action: 'illumi-face-apply', face: { disguised: true } } },
        ],
      }),
    ).toBeNull()
  })
})
