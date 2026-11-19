import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound } from './engine'
import { createBenjaminBaton } from './benjaminBaton'
import { createTeamFight, requestTeamAssist } from './teamMatch'
import { performArsenalCommand, arsenalOptions } from './retrospectiveArsenal'
import { prepareMusseHistory } from './benjaminMusseScenario'
import { benjaminCanRewindMusse, MUSSE_ARCHIVE } from './benjaminMusseArchive'
import { privatePvpState } from './pvp/view'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { fightReplayHash } from './fightReplayHash'
import type { ReplayPacket } from './fightReplayTypes'
import type { FightEnvironment } from './fightEnvironment'
import type { FightState } from './types'

const HISTORY: Partial<FightEnvironment> = {
  preparation: { mode: 'scenario', resources: ['musse-history'], cohorts: [] },
}
function scenario(): FightState {
  return beginFight(
    createFight('benjamin', 'camilla', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: HISTORY,
    }),
  )
}
function view(state: FightState, index: number): FightState {
  return performArsenalCommand(state, 'player', {
    action: 'window-archive',
    target: MUSSE_ARCHIVE[index].id,
  })
}
describe('Benjamin’s demonstrated retrospective Secret Window rewind', () => {
  it('requires the declared historical preparation, an inherited power and actual Camilla rather than a phantom target', () => {
    expect(
      view(beginFight(createFight('benjamin', 'camilla')), 0).player.hatsuEffects.baton
        ?.musseArchive,
    ).toBeUndefined()
    const absent = beginFight(createFight('benjamin', 'hisoka', { environment: HISTORY }))
    expect(view(absent, 0)).toBe(absent)
    expect(
      arsenalOptions(absent, 'player').find((option) => option.command.action === 'window-archive')
        ?.ready,
    ).toBe(false)
    const actual = scenario()
    expect(actual.player.secretWindow).toMatchObject({
      target: 'opponent',
      targetMember: 0,
      musseInheritance: 'canon373',
    })
    expect(actual.player.hatsuEffects.baton?.musseArchive).toMatchObject({
      observer: 'musse',
      subject: 'camilla',
      evolution: 'extended-uninterrupted-monitoring',
    })
    expect(view(actual, 0).player.hatsuEffects.baton?.musseArchive?.cursor).toBe(0)
    const noInheritance = {
      ...absent,
      opponent: { ...actual.opponent },
      player: {
        ...absent.player,
        hatsuEffects: {
          ...absent.player.hatsuEffects,
          baton: createBenjaminBaton([]),
        },
      },
    }
    expect(
      prepareMusseHistory(noInheritance).player.hatsuEffects.baton?.musseArchive,
    ).toBeUndefined()
    const imposter = { ...absent, opponent: { ...actual.opponent, nenOwner: 'chrollo' as const } }
    expect(prepareMusseHistory(imposter).player.hatsuEffects.baton?.musseArchive).toBeUndefined()
  })
  it('rewinds only Musse’s historical record, never a present opponent, after-death footage or an invented third owl', () => {
    const state = scenario()
    const last = view(state, MUSSE_ARCHIVE.length - 1)
    const first = view(last, 0)
    expect(first.player.hatsuEffects.baton?.musseArchive?.cursor).toBe(0)
    expect(first.opponent).toEqual(state.opponent)
    expect(first.player.secretWindow).toEqual(state.player.secretWindow)
    expect(
      performArsenalCommand(first, 'player', {
        action: 'window-archive',
        target: 'body:opponent:0',
      }),
    ).toBe(first)
    expect(
      performArsenalCommand(first, 'player', {
        action: 'window-archive',
        target: 'camilla-resurrection',
      }),
    ).toBe(first)
    const closed = performArsenalCommand(first, 'player', { action: 'window-archive-close' })
    expect(closed.player.hatsuEffects.baton?.musseArchive?.cursor).toBeUndefined()
    expect(closed.player.secretWindow).toEqual(state.player.secretWindow)
  })
  it('requires the same continuing inherited owl, rather than a new mark or a replacement body', () => {
    const state = scenario()
    const recalled = performArsenalCommand(state, 'player', { action: 'window-recall' })
    expect(view(recalled, 0)).toBe(recalled)
    const newMark = {
      ...state,
      player: {
        ...state.player,
        secretWindow: { ...state.player.secretWindow!, musseInheritance: undefined },
      },
    }
    expect(view(newMark, 0)).toBe(newMark)
    const changedSubject = { ...state, opponent: { ...state.opponent, id: 'hisoka' as const } }
    expect(view(changedSubject, 0)).toBe(changedSubject)
    const round = nextRound({ ...state, phase: 'finished', winner: 'player' })
    expect(benjaminCanRewindMusse(round, 'player')).toBe(true)
    expect(
      nextRound({ ...recalled, phase: 'finished', winner: 'player' }).player.secretWindow,
    ).toBeUndefined()
  })
  it('does not grant Benjamin’s developed application to original Musse or to a retained Musse page', () => {
    for (const id of ['musse', 'chrollo', 'kurapika'] as const) {
      const state = beginFight(createFight(id, 'camilla', { environment: HISTORY }))
      expect(view(state, 0)).toBe(state)
      expect(
        arsenalOptions(state, 'player').some(
          (option) => option.command.action === 'window-archive',
        ),
      ).toBe(false)
    }
  })
  it('respects On while allowing a conscious user to close an already viewed record', () => {
    const state = view(scenario(), 0)
    const blocked = { ...state, player: { ...state.player, on: { grudge: 0, sealFrames: 60 } } }
    expect(view(blocked, 1)).toBe(blocked)
    expect(
      arsenalOptions(blocked, 'player')
        .filter((option) => option.command.action === 'window-archive')
        .every((option) => !option.ready),
    ).toBe(true)
    expect(
      performArsenalCommand(blocked, 'player', { action: 'window-archive-close' }).player
        .hatsuEffects.baton?.musseArchive?.cursor,
    ).toBeUndefined()
  })
  it('binds the inherited owl to an actual reserve member and keeps the observing Benjamin’s archive during his relay', () => {
    const initial = beginFight(
      createTeamFight(
        { player: ['benjamin', 'theta', 'biscuit'], opponent: ['hisoka', 'camilla', 'chrollo'] },
        HISTORY,
      ),
    )
    expect(initial.player.secretWindow?.targetMember).toBe(1)
    expect(benjaminCanRewindMusse(initial, 'player')).toBe(true)
    const relayed = requestTeamAssist(
      { ...initial, player: { ...initial.player, x: 7 } },
      'player',
      1,
    )
    expect(relayed.teamMatch!.seats.player.active).toBe(1)
    expect(relayed.player.hatsuEffects.baton).toBeNull()
    expect(
      relayed.teamMatch!.seats.player.members[0].hatsuEffects.baton?.musseArchive,
    ).toBeDefined()
  })
  it('keeps the inherited archive private and replayable across P2 without rewriting historical identities', () => {
    const initial = beginFight(
      createFight('camilla', 'benjamin', {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: HISTORY,
      }),
    )
    const recorder = createReplayRecorder(initial)!
    const next = performArsenalCommand(initial, 'opponent', {
      action: 'window-archive',
      target: MUSSE_ARCHIVE[0].id,
    })
    const packet: ReplayPacket = [1 / 60, 0, 0, [panelReplayCommand(initial, next)]]
    const after = executeReplayPacket(initial, packet)
    recorder.append(initial, packet, after)
    const sample = after.opponent.hatsuEffects.baton!.musseArchive!.observed![0]
    const viewed = performArsenalCommand(after, 'opponent', {
      action: 'window-recorded',
      target: sample.id,
    })
    const recordedPacket: ReplayPacket = [1 / 60, 0, 0, [panelReplayCommand(after, viewed)]]
    const final = executeReplayPacket(after, recordedPacket)
    recorder.append(after, recordedPacket, final)
    const own = privatePvpState(after, 'opponent').player.hatsuEffects.baton!.musseArchive!
    expect(own.observer).toBe('musse')
    expect(own.watched).toEqual({ owner: 'opponent', member: 0 })
    expect(
      privatePvpState(after, 'player').opponent.hatsuEffects.baton?.musseArchive,
    ).toBeUndefined()
    const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
    for (let index = 0; !replay.done && index < 100; index++) replay.advance(0.05, 2)
    expect(replay.error).toBe('')
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(final))
  })
})
