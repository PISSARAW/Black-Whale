import { physicalBodyKey } from './fightBodyIdentity'
import { localPerspective } from './pvp/view'
import { BASHO_ATTESTED_POEMS } from './bashoPoem'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { performArsenalCommand } from './retrospectiveArsenal'
import { performArsenalAction } from './arsenalExecution'
import { toggleEmperorTime } from './kurapikaActions'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { fightReplayHash } from './fightReplayHash'
import { applyPvpCommand } from './pvp/commands'
import { privatePvpState } from './pvp/view'
import { parsePvpPacket } from './pvp/protocol'
import { EMPTY_INPUT, type FightState, type FighterId } from './types'
import type { ReplayPacket } from './fightReplayTypes'

function scenario(source: FighterId = 'hisoka') {
  const base = beginFight(
    createFight('kurapika', source, { mode: 'versus-local', formatId: 'knockout' }),
  )
  let state: FightState = {
    ...base,
    player: { ...base.player, x: 44, aura: 100 },
    opponent: { ...base.opponent, x: 49, aura: 100 },
  }
  const recorder = createReplayRecorder(state)!
  function packet(entry: ReplayPacket) {
    const after = executeReplayPacket(state, entry)
    recorder.append(state, entry, after)
    state = after
  }
  return {
    recorder,
    get state() {
      return state
    },
    command(run: (current: FightState) => FightState) {
      const next = run(state)
      expect(next).not.toBe(state)
      packet([0, 0, 0, [panelReplayCommand(state, next)]])
    },
    frames(count: number) {
      for (let i = 0; i < count; i++) packet([1 / 60, 0, 0, []])
    },
  }
}
function syringe(state: FightState): FightState {
  return performAuraAttack({
    state,
    side: 'player',
    kind: 'special',
    moveId: 'kurapika:backSpecial',
    auraCharged: false,
  })
}
function preparedLoan(source: FighterId = 'hisoka') {
  const run = scenario(source)
  run.command(syringe)
  run.frames(220)
  run.command((state) => toggleEmperorTime(state, 'player'))
  run.command(syringe)
  run.command((state) =>
    performArsenalCommand(state, 'player', { action: 'dolphin-lend', target: 'body:opponent:0' }),
  )
  return run
}
describe('Stealth Dolphin loan replay and the P2 network boundary', () => {
  it('exports and replays real drainage, injection, borrowed use and dismissal', () => {
    const run = preparedLoan()
    run.command((state) =>
      applyPvpCommand(state, 'opponent', { kind: 'arsenal', command: { action: 'dolphin-use' } }),
    )
    run.frames(60)
    expect(run.state.bungeeGum?.owner).toBe('opponent')
    run.command((state) =>
      performArsenalAction(
        { state, side: 'opponent', command: { action: 'dolphin-use' } },
        performAuraAttack,
      ),
    )
    expect(run.state.opponent.dolphinLoan).toBeUndefined()
    const player = createReplayPlayer(decodeFightReplay(JSON.stringify(run.recorder.snapshot())))
    for (let i = 0; !player.done && i < 1000; i++) player.advance(0.05, 2)
    expect(player.done).toBe(true)
    expect(player.error).toBe('')
    expect(fightReplayHash(player.state)).toBe(fightReplayHash(run.state))
  })
  it('replays the borrowed poem editor, its actual paper charm and finite donor stock', () => {
    const run = preparedLoan('basho')
    run.command((state) =>
      applyPvpCommand(state, 'opponent', {
        kind: 'poem',
        loan: true,
        text: BASHO_ATTESTED_POEMS['ward-weak-spirits'].fr,
      }),
    )
    run.frames(60)
    run.command((state) =>
      performArsenalCommand(state, 'opponent', {
        action: 'basho-ward',
        target: 'opponent',
        loan: true,
      }),
    )
    run.frames(10)
    expect(run.state.opponent.bashoWard!.remainingFrames).toBeGreaterThan(0)
    run.command((state) =>
      performArsenalAction(
        { state, side: 'opponent', command: { action: 'dolphin-use' } },
        performAuraAttack,
      ),
    )
    expect(run.state.opponent.writingKit!.sheets).toBe(2)
    expect(run.state.opponent.dolphinLoan).toBeUndefined()
    run.command((state) => toggleEmperorTime(state, 'player'))
    const player = createReplayPlayer(decodeFightReplay(JSON.stringify(run.recorder.snapshot())))
    for (let i = 0; !player.done && i < 1000; i++) player.advance(0.05, 2)
    expect(player.error).toBe('')
    expect(player.done).toBe(true)
    expect(fightReplayHash(player.state)).toBe(fightReplayHash(run.state))
  })
  it('mirrors lender and original victim separately in the recipient’s local P1 view', () => {
    const state = preparedLoan().state
    const local = privatePvpState(state, 'opponent')
    expect(physicalBodyKey(local, 'player')).toBe(physicalBodyKey(state, 'opponent'))
    expect(physicalBodyKey(local, 'opponent')).toBe(physicalBodyKey(state, 'player'))
    expect(localPerspective(['player:senseSeals', 'gum'], true, 'sustainedKeys')).toEqual([
      'opponent:senseSeals',
      'gum',
    ])
    expect(local.player.dolphinLoan?.lender).toEqual({ owner: 'opponent', member: 0 })
    expect(local.player.dolphinLoan?.held.victim).toBe('player')
    expect(local.player.dolphinLoan?.held.victimMember).toBe(0)
    expect(
      parsePvpPacket({
        sequence: 0,
        input: 0,
        commands: [{ kind: 'arsenal', command: { action: 'cookie-massage', loan: true } }],
      }),
    ).not.toBeNull()
    const used = applyPvpCommand(state, 'opponent', {
      kind: 'arsenal',
      command: { action: 'dolphin-use' },
    })
    expect(used.opponent.attack?.hatsuSource).toBe('hisoka')
    const advanced = tickFight(used, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    expect(advanced.opponent.dolphinExecution).toBeUndefined()
    expect(advanced.opponent.dolphinLoanChannel).toBeUndefined()
  })
})
