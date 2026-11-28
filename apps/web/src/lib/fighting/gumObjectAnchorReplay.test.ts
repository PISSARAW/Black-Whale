import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { performArsenalCommand } from './retrospectiveArsenal'
import { executeReplayPacket } from './fightReplayCommands'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { panelReplayCommand } from './fightReplayPanels'
import { fightReplayHash } from './fightReplayHash'
import { packReplayInput } from './fightReplayInput'
import { gumObjectAnchorAi } from './gumObjectAnchorAi'
import { canAttachGumObject, gumObjectAnchors } from './gumObjectAnchors'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { ReplayPacket } from './fightReplayTypes'

function duel(): FightState {
  const base = beginFight(
    createFight('hisoka', 'hisoka', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { arenaInteractions: true },
    }),
  )
  return {
    ...base,
    player: { ...base.player, x: 28.5, aura: 100 },
    opponent: { ...base.opponent, x: 71.5, aura: 100 },
  }
}
describe('object attachments through real AI and replay commands', () => {
  it('keeps both actual owners and shared physical supports through P2 commands, walking, reeling and replay', () => {
    let state = duel()
    const recorder = createReplayRecorder(state)!
    function packet(entry: ReplayPacket) {
      const after = executeReplayPacket(state, entry)
      recorder.append(state, entry, after)
      state = after
    }
    function command(side: FightSide, command: ArsenalCommand) {
      const after = performArsenalCommand(state, side, command)
      expect(after).not.toBe(state)
      packet([0, 0, 0, [panelReplayCommand(state, after)]])
    }
    command('player', { action: 'gum-anchor-attach', target: 'arena:crate:34' })
    command('opponent', { action: 'gum-anchor-attach', target: 'arena:crate:66' })
    for (let index = 0; index < 20; index++) packet([1 / 60, 0, 0, []])
    const walking = packReplayInput({ ...EMPTY_INPUT, right: true })
    for (let index = 0; index < 40; index++) packet([1 / 60, 0, walking, []])
    const jumping = packReplayInput({ ...EMPTY_INPUT, right: true, jump: true })
    for (let index = 0; index < 240 && state.player.x < 59.5; index++)
      packet([1 / 60, jumping, 0, []])
    for (let index = 0; index < 100 && state.player.y > 0; index++) packet([1 / 60, 0, 0, []])
    const secondCrate = 'arena:crate:66'
    for (let index = 0; index < 100 && !canAttachGumObject(state, 'player', secondCrate); index++) {
      const towardCrate = packReplayInput({
        ...EMPTY_INPUT,
        left: state.player.x > 66,
        right: state.player.x < 66,
      })
      packet([1 / 60, towardCrate, 0, []])
    }
    command('player', { action: 'gum-anchor-attach', target: secondCrate })
    command('opponent', { action: 'gum-anchor-object', target: 'arena:crate:66' })
    for (let index = 0; index < 10; index++) packet([1 / 60, 0, 0, []])
    expect(gumObjectAnchors(state.player)).toHaveLength(2)
    expect(gumObjectAnchors(state.opponent)).toHaveLength(1)
    expect(
      state.battlefield!.entities.find((entry) => entry.id === 'arena:crate:66')!.x,
    ).toBeGreaterThan(66)
    expect(state.battlefield!.entities).toHaveLength(2)
    const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
    for (let index = 0; !replay.done && index < 300; index++) replay.advance(0.05, 2)
    expect(replay.error).toBe('')
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
  })
  it('only lets AI attach a present reachable object, then reel toward that actual support', () => {
    const state = duel()
    const attached = gumObjectAnchorAi(state)!
    expect(attached).not.toBeNull()
    expect(gumObjectAnchors(attached.opponent)[0].objectId).toBe('arena:crate:66')
    const ready = { ...attached, opponent: { ...attached.opponent, x: 88, arenaRecovery: 0 } }
    const ordered = gumObjectAnchorAi(ready)!
    expect(gumObjectAnchors(ordered.opponent)[0].pull).toBe('self')
    const empty = beginFight(createFight('hisoka', 'hisoka', { mode: 'versus-local' }))
    expect(gumObjectAnchorAi(empty)).toBeNull()
    const far = { ...state, opponent: { ...state.opponent, x: 93 } }
    expect(gumObjectAnchorAi(far)).toBeNull()
  })
})
