import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from './engine'
import { createChrolloBook, toggleChrolloBookmark } from './chrolloBook'
import { performArsenalCommand, arsenalOptions } from './retrospectiveArsenal'
import { privatePvpState } from './pvp/view'
import { applyPvpCommand } from './pvp/commands'
import { updateEntity } from './preparationWorld'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { panelReplayCommand } from './fightReplayPanels'
import { decodeFightReplay } from './fightReplayCodec'
import { executeReplayPacket } from './fightReplayCommands'
import { packReplayInput } from './fightReplayInput'
import { fightReplayHash } from './fightReplayHash'
import { EMPTY_INPUT, type FightState } from './types'
import type { ReplayPacket } from './fightReplayTypes'

function active(p2 = false): FightState {
  const base = beginFight(
    createFight(p2 ? 'hisoka' : 'chrollo', p2 ? 'chrollo' : 'hisoka', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        preparation: { mode: 'scenario', resources: ['devices'], cohorts: [] },
      },
    }),
  )
  const side = p2 ? 'opponent' : 'player',
    other = p2 ? 'player' : 'opponent'
  return {
    ...base,
    [side]: {
      ...base[side],
      x: 25,
      aura: 100,
      chrolloBook: toggleChrolloBookmark(
        createChrolloBook(['gallery-fake', 'order-stamp', 'sun-and-moon', 'black-voice']),
      ),
    },
    [other]: { ...base[other], x: p2 ? 30 : 18 },
  }
}
function frames(state: FightState, count: number): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}

describe('Gallery Fake command and simulation boundaries', () => {
  it('maps P2’s local body reference back to the canonical original and keeps the resulting reading private', () => {
    const copied = performArsenalCommand(active(true), 'opponent', {
      action: 'history-use',
      target: 'player',
    })
    const settled = frames(copied, 19)
    const state = { ...settled, opponent: { ...settled.opponent, x: settled.player.x + 5.5 } }
    const view = privatePvpState(state, 'opponent')
    const option = arsenalOptions(view, 'player').find(
      (o) => o.command.action === 'history-gallery-locate',
    )!
    expect(option.command.target).toBe('body:opponent:0')
    expect(option.ready).toBe(true)
    const located = applyPvpCommand(state, 'opponent', { kind: 'arsenal', command: option.command })
    expect(located.opponent.chrolloHistorical?.galleryFocus).toMatchObject({
      originalId: 'player',
      originalMember: 0,
    })
    const updatedView = privatePvpState(located, 'opponent')
    expect(updatedView.player.chrolloHistorical?.galleryFocus?.originalId).toBe('opponent')
    expect(
      privatePvpState(located, 'player').opponent.chrolloHistorical?.galleryReading,
    ).toBeUndefined()
  })
  it('tracks a carried copy through actual movement, snapshots and full replay export/import', () => {
    let state = updateEntity(active(), 'player:device:camera', { x: 22 })
    const recorder = createReplayRecorder(state)!
    function packet(entry: ReplayPacket) {
      const after = executeReplayPacket(state, entry)
      recorder.append(state, entry, after)
      state = after
    }
    function change(run: (current: FightState) => FightState) {
      const after = run(state)
      expect(after).not.toBe(state)
      packet([0, 0, 0, [panelReplayCommand(state, after)]])
    }
    change((s) =>
      performArsenalCommand(s, 'player', { action: 'history-use', target: 'player:device:camera' }),
    )
    for (let i = 0; i < 19; i++) packet([1 / 60, 0, 0, []])
    const id = state.battlefield!.entities.find((e) => e.copy)!.id
    change((s) => performArsenalCommand(s, 'opponent', { action: 'device-pickup', target: id }))
    change((s) =>
      performArsenalCommand(s, 'player', {
        action: 'history-gallery-locate',
        target: 'player:device:camera',
      }),
    )
    for (let i = 0; i < 50; i++)
      packet([1 / 60, 0, packReplayInput({ ...EMPTY_INPUT, left: true }), []])
    const reading = state.player.chrolloHistorical!.galleryReading!
    expect(reading.copies[0].x).toBeCloseTo(state.opponent.x + state.opponent.facing * 2.5)
    expect(reading.copies[0].x).not.toBe(20)
    const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
    while (!replay.done) replay.advance(0.1)
    expect(replay.error).toBe('')
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
  })
})
