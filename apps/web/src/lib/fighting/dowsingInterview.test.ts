import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from './engine'
import { performArsenalCommand } from './retrospectiveArsenal'
import { speakPaperWords } from './kallutoListening'
import { dowsingAi } from './dowsingAi'
import { advanceDowsing } from './dowsingAction'
import { createTeamFight } from './teamMatch'
import { applyPvpCommand } from './pvp/commands'
import { parsePvpPacket } from './pvp/protocol'
import { privatePvpState } from './pvp/view'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { fightReplayHash } from './fightReplayHash'
import { toggleEmperorTime } from './kurapikaActions'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'
import type { ReplayPacket } from './fightReplayTypes'

function duel(): FightState {
  const base = beginFight(createFight('kurapika', 'hisoka', { mode: 'versus-local' }))
  return {
    ...base,
    player: { ...base.player, x: 42, aura: 100 },
    opponent: { ...base.opponent, x: 48 },
  }
}
function ask(state = duel(), target = 'question:Pourquoi es-tu venu ici ?'): FightState {
  return performArsenalCommand(state, 'player', { action: 'dowsing-ask', target })
}
function answer(state: FightState, target: string): FightState {
  return performArsenalCommand(state, 'opponent', { action: 'dowsing-answer', target })
}

describe('Dowsing interviews beyond the three predefined facts', () => {
  it.each(['truth', 'lie'])(
    'screens an actual written %s reply without inferring objective truth',
    (intent) => {
      const state = duel()
      const asked = ask(state)
      expect(asked.opponent.heardWords?.text).toBe('Pourquoi es-tu venu ici ?')
      expect(asked.opponent.dowsingPrompt).toMatchObject({
        question: 'free',
        askerMember: 0,
        targetMember: 0,
      })
      const result = answer(asked, `${intent}:Je cherche quelqu’un.`)
      expect(result.player.dowsingReading).toMatchObject({
        text: 'Je cherche quelqu’un.',
        swings: intent === 'lie',
      })
      expect(result.player.heardWords?.text).toBe('Je cherche quelqu’un.')
      expect(result.player.kurapika?.emperorTime).toBe(false)
      expect(result.player.aura).toBe(97)
      expect(result.opponent.health).toBe(state.opponent.health)
      expect(result.opponent.dowsingPrompt).toBeUndefined()
      expect(JSON.stringify(result.player.dowsingReading)).not.toContain('hisoka')
    },
  )
  it('keeps silence, unlabelled speech and an unrepresented intention distinct from a sincere answer', () => {
    const state = ask()
    expect(answer(state, 'sincere')).toBe(state)
    expect(
      speakPaperWords(state, 'opponent', 'Je cherche quelqu’un.').player.dowsingReading,
    ).toBeUndefined()
    const unknown = speakPaperWords(state, 'opponent', {
      text: 'Je cherche quelqu’un.',
      dowsingReply: { askedAt: state.frame },
    })
    expect(unknown.player.dowsingReading?.inconclusive).toBe(true)
    expect(dowsingAi({ ...state, frame: state.frame + 30 })).toBeNull()
  })
  it('screens a matching conscious fact spoken through the common voice circuit', () => {
    const state = ask(duel(), 'identity')
    const result = speakPaperWords(state, 'opponent', {
      text: 'Je suis Kurapika.',
      statementFact: 'identity',
      statementIntent: true,
    })
    expect(result.player.dowsingReading).toMatchObject({ text: 'Je suis Kurapika.', swings: true })
    const unrelated = speakPaperWords(state, 'opponent', {
      text: 'Je ne dissimule pas mon aura.',
      statementFact: 'in',
      statementIntent: false,
    })
    expect(unrelated.player.dowsingReading).toBeUndefined()
  })
  it('requires the same visible face-to-face focus and refuses a stale or misdirected answer', () => {
    const state = ask()
    const stale = speakPaperWords(state, 'opponent', {
      text: 'Ancienne réponse.',
      statementIntent: true,
      dowsingReply: { askedAt: state.frame - 1 },
    })
    expect(stale.player.dowsingReading).toBeUndefined()
    for (const patch of [
      { facing: -1 as const },
      { coveringEars: true },
      { hitStun: 10 },
      { x: 10 },
      { on: { grudge: 1, sealFrames: 30 } },
    ]) {
      const blocked = { ...state, player: { ...state.player, ...patch } }
      expect(answer(blocked, 'lie:Une réponse.')).toBe(blocked)
      expect(advanceDowsing(blocked).player.dowsingSession).toBeUndefined()
    }
  })
  it('does not transfer an interview to another team member occupying the same side', () => {
    const base = beginFight(
      createTeamFight({
        player: ['kurapika', 'theta', 'biscuit'],
        opponent: ['hisoka', 'chrollo', 'franklin'],
      }),
    )
    const state = ask({
      ...base,
      player: { ...base.player, x: 42, aura: 100 },
      opponent: { ...base.opponent, x: 48 },
    })
    for (const side of ['player', 'opponent'] as const) {
      const changed = {
        ...state,
        teamMatch: {
          ...state.teamMatch!,
          seats: {
            ...state.teamMatch!.seats,
            [side]: { ...state.teamMatch!.seats[side], active: 1 },
          },
        },
      }
      expect(answer(changed, 'lie:Une réponse.')).toBe(changed)
      expect(advanceDowsing(changed).player.dowsingSession).toBeUndefined()
    }
  })
  it('retains On and permits an ordinary answer from its user without granting Nen to the reader', () => {
    const state = ask()
    const enabled = {
      ...state,
      opponent: { ...state.opponent, nen: { ...state.opponent.nen, on: true } },
    }
    const result = answer(enabled, 'truth:Je peux répondre.')
    expect(result.player.dowsingReading?.swings).toBe(false)
    expect(result.opponent.nen.on).toBe(true)
    expect(result.opponent.aura).toBe(enabled.opponent.aura)
    const sealed = {
      ...duel(),
      player: { ...duel().player, nen: { ...duel().player.nen, on: true } },
    }
    expect(ask(sealed)).toBe(sealed)
  })
  it('does not manufacture a reading when Judgment kills the speaker for a conscious lie', () => {
    const base = duel()
    const bound = {
      ...base,
      opponent: {
        ...base.opponent,
        judgmentChain: {
          owner: 'player' as const,
          rule: 'truthful-answers' as const,
          inquiry: { text: 'Qui es-tu ?', fact: 'identity' as const, askedAt: base.frame },
        },
      },
    }
    const result = answer(ask(bound, 'identity'), 'lie')
    expect(result.opponent.health).toBe(0)
    expect(result.player.dowsingReading).toBeUndefined()
  })
  it('requires the real right hand to be available, including for video screening', () => {
    const base = beginFight(
      createFight('kurapika', 'hisoka', {
        mode: 'versus-local',
        environment: { preparation: { mode: 'scenario', resources: ['devices'], cohorts: [] } },
      }),
    )
    const state = {
      ...base,
      player: { ...base.player, x: 25, aura: 100 },
      opponent: { ...base.opponent, x: 40 },
    }
    const occupied = performArsenalCommand(state, 'player', {
      action: 'device-pickup',
      target: 'player:device:camera',
    })
    expect(occupied).not.toBe(state)
    expect(
      occupied.battlefield!.entities.find((entry) => entry.device?.carrier === 'player')?.device
        ?.hand,
    ).toBe('right')
    expect(ask(occupied)).toBe(occupied)
    const freed = performArsenalCommand(occupied, 'player', {
      action: 'device-drop',
      target: 'player:device:camera',
    })
    expect(ask(freed).opponent.dowsingPrompt?.question).toBe('free')
  })
  it('applies both powers to an explicitly identified answer to the same free question', () => {
    const base = duel()
    const bound = {
      ...base,
      opponent: {
        ...base.opponent,
        judgmentChain: { owner: 'player' as const, rule: 'truthful-answers' as const },
      },
    }
    const asked = performArsenalCommand(ask(bound), 'player', {
      action: 'judgment-ask',
      target: 'question:Pourquoi es-tu venu ici ?',
    })
    const fatal = answer(asked, 'lie:Je cherche quelqu’un.')
    expect(fatal.opponent.health).toBe(0)
    expect(fatal.player.dowsingReading).toBeUndefined()
    const sincere = answer(asked, 'truth:Je cherche quelqu’un.')
    expect(sincere.opponent.judgmentChain?.inquiry).toBeUndefined()
    expect(sincere.player.dowsingReading?.swings).toBe(false)
    const throughJudgment = performArsenalCommand(asked, 'opponent', {
      action: 'judgment-answer',
      target: 'truth:Je cherche quelqu’un.',
    })
    expect(throughJudgment.player.dowsingReading?.text).toBe('Je cherche quelqu’un.')
    expect(throughJudgment.opponent.dowsingPrompt).toBeUndefined()
  })
  it('records the actual free reply and screens it later only through the admissible camera and Emperor Time', () => {
    const base = beginFight(
      createFight('kurapika', 'hisoka', {
        mode: 'versus-local',
        environment: { preparation: { mode: 'scenario', resources: ['devices'], cohorts: [] } },
      }),
    )
    let state: FightState = {
      ...base,
      player: { ...base.player, x: 25, aura: 100 },
      opponent: { ...base.opponent, x: 40 },
    }
    state = performArsenalCommand(state, 'player', {
      action: 'device-record',
      target: 'player:device:camera',
    })
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    state = answer(ask(state), 'lie:Je connais cette personne.')
    expect(state.player.dowsingReading?.swings).toBe(true)
    state = performArsenalCommand(state, 'player', { action: 'dowsing-stop' })
    state = performArsenalCommand(state, 'player', {
      action: 'device-watch',
      target: 'player:device:camera',
    })
    const index = state.player.devicePlayback!.words.findIndex(
      (word) => word.text === 'Je connais cette personne.',
    )
    expect(index).toBeGreaterThanOrEqual(0)
    expect(state.player.devicePlayback!.words[index]).not.toHaveProperty('deliberateLie')
    const command = { action: 'dowsing-video' as const, target: String(index) }
    expect(performArsenalCommand(state, 'player', command)).toBe(state)
    state = toggleEmperorTime(state, 'player')
    const result = performArsenalCommand(state, 'player', command)
    expect(result.player.dowsingReading).toMatchObject({
      text: 'Je connais cette personne.',
      swings: true,
      source: { deviceId: 'player:device:camera' },
    })
    const occupied = performArsenalCommand(state, 'player', {
      action: 'device-pickup',
      target: 'player:device:camera',
    })
    expect(performArsenalCommand(occupied, 'player', command)).toBe(occupied)
  })
  it('accepts the full bounded editor text at the PvP boundary and replays P2’s actual question and answer', () => {
    const base = duel()
    let state: FightState = {
      ...base,
      player: { ...base.opponent, x: 42, facing: 1 as const },
      opponent: { ...base.player, x: 48, facing: -1 as const },
    }
    const recorder = createReplayRecorder(state)!
    function command(side: FightSide, action: 'dowsing-ask' | 'dowsing-answer', target: string) {
      const packet = {
        sequence: 0,
        input: 0,
        commands: [{ kind: 'arsenal', command: { action, target } }],
      }
      expect(parsePvpPacket(packet)).not.toBeNull()
      const after = applyPvpCommand(
        state,
        side,
        packet.commands[0] as Parameters<typeof applyPvpCommand>[2],
      )
      expect(after).not.toBe(state)
      const entry: ReplayPacket = [0, 0, 0, [panelReplayCommand(state, after)]]
      const final = executeReplayPacket(state, entry)
      recorder.append(state, entry, final)
      state = final
    }
    command('opponent', 'dowsing-ask', `question:${'Q'.repeat(160)}`)
    command('player', 'dowsing-answer', `lie:${'R'.repeat(160)}`)
    const frame: ReplayPacket = [1 / 60, 0, 0, []]
    const after = executeReplayPacket(state, frame)
    recorder.append(state, frame, after)
    state = after
    expect(state.opponent.dowsingReading?.swings).toBe(true)
    expect(privatePvpState(state, 'player').opponent.dowsingReading).toBeUndefined()
    expect(privatePvpState(state, 'opponent').player.dowsingReading?.swings).toBe(true)
    const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
    for (let index = 0; !replay.done && index < 30; index++) replay.advance(0.05, 2)
    expect(replay.error).toBe('')
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
    expect(
      parsePvpPacket({
        sequence: 0,
        input: 0,
        commands: [
          {
            kind: 'arsenal',
            command: {
              action: 'dowsing-ask',
              target: `question:${'Q'.repeat(161)}`,
            },
          },
        ],
      }),
    ).toBeNull()
  })
  it('keeps the scene running after an ordinary sincere reply', () => {
    const state = answer(ask(), 'truth:Une réponse sincère.')
    const next = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    expect(next.frame).toBe(state.frame + 1)
    expect(next.player.dowsingReading).toEqual(state.player.dowsingReading)
  })
})
