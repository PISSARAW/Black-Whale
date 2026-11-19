import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, tickFight } from './engine'
import { createTeamFight, requestTeamAssist, tickTeamFight } from './teamMatch'
import { speakPaperWords } from './kallutoListening'
import { arsenalOptions, performArsenalCommand } from './retrospectiveArsenal'
import { privatePvpState } from './pvp/view'
import { musseHatsu } from './hatsu/musse'
import { EMPTY_INPUT, type FightInput, type FightState } from './types'

const HISTORY = {
  preparation: { mode: 'scenario' as const, resources: ['musse-history' as const], cohorts: [] },
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
function frame(state: FightState, input: FightInput = EMPTY_INPUT): FightState {
  return tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: input })
}
function archive(state: FightState) {
  return state.player.hatsuEffects.baton!.musseArchive!
}

describe('rewinding observations actually received by Benjamin', () => {
  it('records movement and real remote words and keeps a selected past view independent of the current body', () => {
    const idle = frame(scenario())
    const first = archive(idle).observed![0]
    const walking = frame(idle, { ...EMPTY_INPUT, left: true })
    expect(archive(walking).observed!.at(-1)?.action).toBe('walk')
    const spoken = speakPaperWords(walking, 'opponent', {
      text: 'Une phrase effectivement prononcée.',
      statementIntent: true,
    })
    const words = archive(spoken).observed!.at(-1)!
    expect(words.words).toEqual({
      frame: spoken.frame,
      text: 'Une phrase effectivement prononcée.',
    })
    expect(words).not.toHaveProperty('deliberateLie')
    expect(words).not.toHaveProperty('moveId')
    expect(words).not.toHaveProperty('aura')
    const viewed = performArsenalCommand(spoken, 'player', {
      action: 'window-recorded',
      target: first.id,
    })
    expect(archive(viewed).observedCursor).toBe(first.id)
    expect(archive(viewed).observed!.find((entry) => entry.id === first.id)).toEqual(first)
    expect(first.action).toBe('idle')
    expect(first.words).toBeUndefined()
    const options = arsenalOptions(viewed, 'player').filter(
      (option) => option.command.action === 'window-recorded',
    )
    expect(new Set(options.map((option) => option.command.target)).size).toBe(options.length)
    const current = frame(viewed, { ...EMPTY_INPUT, guard: true })
    expect(archive(current).observedCursor).toBe(first.id)
    expect(archive(current).observed!.find((entry) => entry.id === first.id)?.action).toBe('idle')
    expect(current.opponent.health).toBe(spoken.opponent.health)
  })
  it('never invents pre-contact observations in an ordinary unprepared duel, or a forged record id', () => {
    const ordinary = frame(beginFight(createFight('benjamin', 'camilla')))
    expect(ordinary.player.hatsuEffects.baton?.musseArchive).toBeUndefined()
    const state = frame(scenario())
    expect(
      performArsenalCommand(state, 'player', {
        action: 'window-recorded',
        target: 'observation:9999',
      }),
    ).toBe(state)
  })
  it('keeps identifiers unique across rounds and does not repeat an old utterance as a new one', () => {
    const spoken = speakPaperWords(frame(scenario()), 'opponent', 'Parole de la première manche.')
    const old = archive(spoken).observed!.at(-1)!
    const next = frame(beginFight(nextRound({ ...spoken, phase: 'finished', winner: 'player' })))
    const latest = archive(next).observed!.at(-1)!
    expect(latest.round).toBe(2)
    expect(latest.id).not.toBe(old.id)
    expect(latest.words).toBeUndefined()
    expect(archive(next).observed!.some((entry) => entry.id === old.id)).toBe(true)
  })
  it('keeps the observations on the actual Benjamin in reserve without giving them to his replacement', () => {
    const team = beginFight(
      createTeamFight(
        { player: ['benjamin', 'theta', 'biscuit'], opponent: ['camilla', 'hisoka', 'chrollo'] },
        HISTORY,
      ),
    )
    const relayed = requestTeamAssist({ ...team, player: { ...team.player, x: 7 } }, 'player', 1)
    const next = tickTeamFight(relayed, { player: EMPTY_INPUT, opponent: EMPTY_INPUT }, 1 / 60)
    expect(next.player.hatsuEffects.baton).toBeNull()
    expect(
      next.teamMatch!.seats.player.members[0].hatsuEffects.baton?.musseArchive?.observed,
    ).toHaveLength(1)
    expect(
      privatePvpState(next, 'opponent').teamMatch!.seats.opponent.members[0].hatsuEffects.baton
        ?.musseArchive,
    ).toBeUndefined()
  })
  it('does not build new history from a redacted P2 client snapshot or during an On seal', () => {
    const state = frame(scenario())
    const view = privatePvpState(state, 'player')
    const simulated = musseHatsu.onFrame({
      ...view,
      opponent: { ...view.opponent, pose: 'special' },
    })
    expect(archive(simulated).observed).toEqual(archive(view).observed)
    const sealed = frame({
      ...state,
      player: { ...state.player, on: { grudge: 0, sealFrames: 60 } },
    })
    expect(archive(sealed).observed).toEqual(archive(state).observed)
  })
})
