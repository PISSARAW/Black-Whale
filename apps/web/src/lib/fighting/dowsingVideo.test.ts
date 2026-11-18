import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight, nextRound } from './engine'
import { performArsenalCommand, arsenalOptions } from './retrospectiveArsenal'
import { toggleEmperorTime } from './kurapikaActions'
import { advanceDowsing } from './dowsingAction'
import { observePersonalEncounters } from './personalEncounters'
import { dowsingAi } from './dowsingAi'
import { speakPaperWords } from './kallutoListening'
import { deviceEntity, changeDevice } from './physicalDevices'
import { privatePvpState } from './pvp/view'
import { applyPvpCommand } from './pvp/commands'
import { dowsingIndication } from './dowsingPresentation'
import { fightReplayHash } from './fightReplayHash'
import { encodeFightSnapshot, decodeFightSnapshot } from './fightReplaySnapshot'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

function use(
  state: FightState,
  side: FightSide,
  action: Parameters<typeof performArsenalCommand>[2]['action'],
  target?: string,
) {
  return performArsenalCommand(state, side, { action, target })
}
function advance(state: FightState, count = 1) {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
  return state
}
function filmed(
  side: FightSide = 'player',
  intent: 'sincere' | 'lie' | 'free' = 'lie',
): FightState {
  const subject = side === 'player' ? 'opponent' : 'player'
  let state = beginFight(
    createFight(
      side === 'player' ? 'kurapika' : 'hisoka',
      side === 'player' ? 'hisoka' : 'kurapika',
      {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: { preparation: { mode: 'scenario', resources: ['devices'], cohorts: [] } },
      },
    ),
  )
  state = {
    ...state,
    player: { ...state.player, x: side === 'player' ? 25 : 60, aura: 100 },
    opponent: { ...state.opponent, x: side === 'player' ? 40 : 75, aura: 100 },
  }
  state = use(state, side, 'device-record', `${side}:device:camera`)
  state = advance(state)
  state =
    intent === 'free'
      ? speakPaperWords(state, subject, 'Je connais la réponse.')
      : use(state, subject, intent === 'lie' ? 'statement-lie' : 'statement-sincere', 'identity')
  state = use(state, side, 'device-watch', `${side}:device:camera`)
  state = toggleEmperorTime(state, side)
  return state
}
function read(state: FightState, side: FightSide = 'player') {
  return use(state, side, 'dowsing-video', '0')
}

describe('Dowsing screens a real video with Emperor Time and actual prior familiarity', () => {
  it.each<FightSide>(['player', 'opponent'])(
    'rejects the obsolete metadata-only command rather than bypassing actual prior encounters for %s',
    (side) => {
      const base = filmed(side)
      const other = side === 'player' ? 'opponent' : 'player'
      const state: FightState = {
        ...base,
        [side]: { ...base[side], personalEncounters: undefined },
        battlefield: {
          ...base.battlefield!,
          entities: [
            ...base.battlefield!.entities,
            {
              id: 'legacy-metadata-camera',
              kind: 'camera',
              owner: side,
              x: base[side].x,
              y: 0,
              present: true,
              material: 'real',
              health: 40,
              statements: [
                {
                  frame: 1,
                  sequence: 1,
                  subject: base[other].id,
                  appearance: base[other].id,
                  text: 'Ancienne métadonnée.',
                  consciousLie: true,
                },
              ],
            },
          ],
        },
      }
      expect(use(state, side, 'dowsing-video', 'legacy-metadata-camera|1')).toBe(state)
      expect(read(state, side)).toBe(state)
      const legitimate = {
        ...state,
        [side]: { ...state[side], personalEncounters: base[side].personalEncounters },
      }
      expect(read(legitimate, side)[side].dowsingReading?.source?.deviceId).toBe(
        `${side}:device:camera`,
      )
      expect(read(legitimate, side)[side].dowsingReading?.swings).toBe(true)
    },
  )
  it.each(['sincere', 'lie'] as const)(
    'screens a recorded %s statement without the subject still facing Kurapika',
    (intent) => {
      const state = filmed('player', intent)
      expect(state.player.personalEncounters?.[0]).toMatchObject({
        bodyKey: 'opponent:0',
        appearance: 'hisoka',
      })
      const remote = { ...state, opponent: { ...state.opponent, x: 90, facing: 1 as const } }
      const result = read(remote)
      expect(result.player.dowsingReading?.swings).toBe(intent === 'lie')
      expect(result.player.dowsingReading?.source).toMatchObject({
        deviceId: 'player:device:camera',
        recordedAt: 1,
      })
      expect(result.player.aura).toBe(remote.player.aura - 3)
      expect(result.player.dowsingSession?.question).toBe('recording')
      expect(result.opponent.health).toBe(remote.opponent.health)
      const after = advance(result, 2)
      expect(after.player.dowsingSession?.video).toBeTruthy()
      expect(after.player.kurapika!.lifespanFrames).toBeGreaterThan(
        result.player.kurapika!.lifespanFrames,
      )
    },
  )
  it('does not infer free-text intent from hidden fight state or fabricate a verdict', () => {
    const result = read(filmed('player', 'free'))
    expect(result.player.dowsingReading?.inconclusive).toBe(true)
    expect(dowsingIndication(result.player.dowsingReading!, 'fr')).toContain('indéterminé')
    expect(result.player.dowsingReading?.text).toBe('Je connais la réponse.')
  })
  it('refuses without Emperor Time, a previous encounter, vision, hearing or a usable chain', () => {
    const state = filmed()
    for (const patch of [
      { kurapika: { ...state.player.kurapika!, emperorTime: false } },
      { personalEncounters: undefined },
      {
        personalEncounters: [
          { bodyKey: 'opponent:1', appearance: 'hisoka' as const, round: 1, frame: 0 },
        ],
      },
      {
        personalEncounters: [
          { bodyKey: 'opponent:0', appearance: 'theta' as const, round: 1, frame: 0 },
        ],
      },
      {
        personalEncounters: [
          { bodyKey: 'opponent:0', appearance: 'hisoka' as const, round: 1, frame: state.frame },
        ],
      },
      { hatsuEffects: { ...state.player.hatsuEffects, senseSeals: 2 } },
      { coveringEars: true },
      { parallelEyesClosed: true },
      { x: 70 },
      { aura: 2 },
      { hatsuEffects: { ...state.player.hatsuEffects, forcedZetsuFrames: 50 } },
      { hatsuEffects: { ...state.player.hatsuEffects, senseSeals: 1 } },
    ]) {
      const blocked = { ...state, player: { ...state.player, ...patch } }
      expect(read(blocked)).toBe(blocked)
    }
  })
  it('needs the recorded visible face and actual media, rather than a snapshot of arbitrary text', () => {
    const state = filmed(),
      camera = deviceEntity(state, 'player:device:camera')!
    const unseen = changeDevice(state, camera, {
      words: camera.device!.words!.map((w) => ({ ...w, visibleBody: false })),
    })
    expect(read(unseen)).toBe(unseen)
    const erased = changeDevice(state, camera, { words: [] })
    expect(read(erased)).toBe(erased)
    const exhausted = changeDevice(state, camera, { batteryFrames: 0 })
    expect(read(exhausted)).toBe(exhausted)
    const destroyed = {
      ...state,
      battlefield: {
        ...state.battlefield!,
        entities: state.battlefield!.entities.filter((e) => e.id !== camera.id),
      },
    }
    expect(read(destroyed)).toBe(destroyed)
  })
  it.each(['player', 'opponent'] as const)(
    'keeps ordinary playback and private %s analysis distinct in PvP',
    (side) => {
      const state = filmed(side),
        viewer = privatePvpState(state, side)
      expect(JSON.stringify(viewer)).not.toContain('deliberateLie')
      expect(viewer.player.devicePlayback?.words[0]).not.toHaveProperty('deliberateLie')
      expect(
        arsenalOptions(viewer, 'player').find((o) => o.command.action === 'dowsing-video')?.ready,
      ).toBe(true)
      const result = applyPvpCommand(state, side, {
        kind: 'arsenal',
        command: { action: 'dowsing-video', target: '0' },
      })
      expect(privatePvpState(result, side).player.dowsingReading?.swings).toBe(true)
      expect(
        privatePvpState(result, side === 'player' ? 'opponent' : 'player').opponent.dowsingReading,
      ).toBeUndefined()
      expect(
        privatePvpState(result, side === 'player' ? 'opponent' : 'player').opponent
          .personalEncounters,
      ).toBeUndefined()
    },
  )
  it('retains the reading as past knowledge but ends focus when the camera, Emperor Time or the body is lost', () => {
    const result = read(filmed())
    for (const patch of [
      { x: 75 },
      { hitStun: 8 },
      { kurapika: { ...result.player.kurapika!, emperorTime: false } },
    ]) {
      const ended = advanceDowsing({ ...result, player: { ...result.player, ...patch } })
      expect(ended.player.dowsingSession).toBeUndefined()
      expect(ended.player.dowsingReading).toEqual(result.player.dowsingReading)
    }
  })
  it('can meet a blind subject without granting an encounter to a blind observer', () => {
    const state = filmed()
    const subjectBlind = {
      ...state,
      player: { ...state.player, personalEncounters: undefined },
      opponent: {
        ...state.opponent,
        hatsuEffects: { ...state.opponent.hatsuEffects, senseSeals: 1 },
      },
    }
    expect(observePersonalEncounters(subjectBlind).player.personalEncounters).toHaveLength(1)
    const viewerBlind = {
      ...state,
      player: {
        ...state.player,
        personalEncounters: undefined,
        hatsuEffects: { ...state.player.hatsuEffects, senseSeals: 1 },
      },
    }
    expect(observePersonalEncounters(viewerBlind).player.personalEncounters).toBeUndefined()
  })
  it('retains real encounters between rounds even though the frame counter restarts', () => {
    const state = filmed()
    const restarted = nextRound({
      ...state,
      phase: 'finished',
      winner: 'player',
      matchWinner: null,
    })
    expect(restarted.frame).toBe(0)
    expect(restarted.player.personalEncounters).toEqual(state.player.personalEncounters)
    expect(restarted.player.devicePlayback).toBeUndefined()
  })
  it('records live structured answers, keeps statements voluntary and does not grant Nen to a speaker', () => {
    let state = filmed('player', 'sincere')
    state = use(state, 'player', 'dowsing-ask', 'in')
    state = use(state, 'opponent', 'dowsing-answer', 'lie')
    expect(deviceEntity(state, 'player:device:camera')?.device?.words?.at(-1)?.deliberateLie).toBe(
      true,
    )
    const asleep = {
      ...state,
      opponent: {
        ...state.opponent,
        arsenalSleep: { owner: 'player' as const, cause: 'cookie' as const },
      },
    }
    expect(use(asleep, 'opponent', 'statement-lie', 'identity')).toBe(asleep)
    const on = {
      ...state,
      opponent: { ...state.opponent, nen: { ...state.opponent.nen, on: true } },
    }
    const spoken = use(on, 'opponent', 'statement-sincere', 'nen')
    expect(deviceEntity(spoken, 'player:device:camera')?.device?.words?.at(-1)?.text).toContain(
      'on',
    )
    expect(spoken.opponent.nen.on).toBe(true)
  })
  it('distinguishes identical words spoken with different intent in the same frame', () => {
    let state = filmed('player', 'free')
    state = use(state, 'opponent', 'statement-sincere', 'nen')
    state = {
      ...state,
      opponent: { ...state.opponent, nen: { ...state.opponent.nen, mode: 'zetsu' } },
    }
    state = use(state, 'opponent', 'statement-lie', 'nen')
    state = use(state, 'player', 'device-watch', 'player:device:camera')
    const words = state.player.devicePlayback!.words
    expect(words[1].text).toBe(words[2].text)
    expect(words[1].frame).toBe(words[2].frame)
    expect(words[1].sampleId).not.toBe(words[2].sampleId)
    expect(use(state, 'player', 'dowsing-video', '1').player.dowsingReading?.swings).toBe(false)
    expect(use(state, 'player', 'dowsing-video', '2').player.dowsingReading?.swings).toBe(true)
  })
  it('does not give a chain-only thief Emperor Time, and enforces a real Judgment violation', () => {
    const state = filmed()
    const thief = {
      ...state,
      player: {
        ...state.player,
        id: 'chrollo' as const,
        kurapika: undefined,
        chrolloBook: {
          pages: ['kurapika:forwardSpecial' as const],
          page: 0,
          bookmark: 'kurapika:forwardSpecial' as const,
          open: false,
        },
      },
    }
    expect(read(thief)).toBe(thief)
    const bound = {
      ...state,
      player: {
        ...state.player,
        judgmentChain: { owner: 'opponent' as const, rule: 'zetsu' as const },
      },
    }
    const violated = read(bound)
    expect(violated.player.health).toBe(0)
    expect(violated.player.dowsingReading).toBeUndefined()
  })
  it('executes the same authenticated analysis after a snapshot and lets the AI read its actual playback', () => {
    const state = filmed('opponent')
    const restored = decodeFightSnapshot(encodeFightSnapshot(state), {
      player: 'hisoka',
      opponent: 'kurapika',
      mode: state.mode,
      formatId: state.formatId,
      environment: state.environment,
    })
    expect(fightReplayHash(read(restored, 'opponent'))).toBe(
      fightReplayHash(read(state, 'opponent')),
    )
    const result = dowsingAi(state)!
    expect(result.opponent.dowsingReading?.swings).toBe(true)
    expect(result.player.dowsingReading).toBeUndefined()
  })
})
