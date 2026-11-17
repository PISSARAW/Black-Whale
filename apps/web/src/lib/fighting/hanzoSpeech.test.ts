import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, tickFight } from './engine'
import { speakPaperWords, voiceAvailable } from './kallutoListening'
import { speakBattleWords } from './battleConversation'
import { callHanzoBody } from './hanzoBodyCall'
import { advanceDeviceRecordings } from './deviceRecording'
import { updateEntity } from './preparationWorld'
import { privatePvpState } from './pvp/view'
import { encodeFightSnapshot, decodeFightSnapshot } from './fightReplaySnapshot'
import { fightReplayHash } from './fightReplayHash'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { executeReplayPacket } from './fightReplayCommands'
import { packReplayInput } from './fightReplayInput'
import type { ReplayPacket } from './fightReplayTypes'
import { EMPTY_INPUT, type FightState, type FighterId } from './types'

function projected(opponent: FighterId = 'basho'): FightState {
  const base = beginFight(
    createFight('hanzo', opponent, {
      mode: 'versus-local',
      environment: {
        preparation: { mode: 'scenario', resources: ['devices'], cohorts: [] },
      },
    }),
  )
  let state = performAttack(
    {
      ...base,
      player: { ...base.player, x: 20, aura: 100 },
      opponent: { ...base.opponent, x: 75, aura: 100 },
    },
    'player',
    'special',
  )
  for (let i = 0; i < 24; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  expect(state.player.hanzoProjection?.startupFrames).toBe(0)
  return { ...state, player: { ...state.player, x: 70 } }
}
function cameraAt(state: FightState, id: string, x: number): FightState {
  const entry = state.battlefield!.entities.find((e) => e.id === id)!
  return updateEntity(state, id, { x, device: { ...entry.device!, recording: true, facing: 1 } })
}
function camera(state: FightState, id = 'player:device:camera') {
  return state.battlefield!.entities.find((e) => e.id === id)!.device!
}

describe('Hanzo’s speaking double has its own position without moving the sleeping body', () => {
  it('replays the actual Talk input and camera recording without a state patch', () => {
    let state = cameraAt(projected(), 'player:device:camera', 65)
    const recorder = createReplayRecorder(state)!
    for (let i = 0; i < 30; i++) {
      const packet: ReplayPacket = [
        1 / 60,
        packReplayInput({ ...EMPTY_INPUT, call: i === 0 }),
        0,
        [],
      ]
      const next = executeReplayPacket(state, packet)
      recorder.append(state, packet, next)
      state = next
    }
    expect(camera(state).words?.at(-1)?.projection).toBe(true)
    expect(state.opponent.heardWords?.text).toBe('I am here.')
    const imported = decodeFightReplay(JSON.stringify(recorder.snapshot()))
    const replay = createReplayPlayer(imported)
    while (!replay.done) replay.advance(0.1)
    expect(replay.error).toBe('')
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
  })
  it.each(['player', 'opponent'] as const)(
    'permits a real conversation with the controlled double on %s',
    (side) => {
      const base = projected()
      const state =
        side === 'player' ? base : { ...base, player: base.opponent, opponent: base.player }
      const other = side === 'player' ? 'opponent' : 'player'
      const said = speakBattleWords(state, side, 'Je suis venu te parler.')
      expect(said[other].heardWords?.text).toBe('Je suis venu te parler.')
      expect(said[side].hanzoProjection?.bodyX).toBe(20)
      const reply = speakPaperWords(said, other, 'Je t’écoute.')
      expect(reply[side].heardWords?.text).toBe('Je t’écoute.')
      expect(reply[side].hanzoProjection?.bodyX).toBe(20)
    },
  )
  it('keeps addressing the sleeping body distinct from talking to the distant double', () => {
    const base = projected()
    const state = { ...base, opponent: { ...base.opponent, x: 25 } }
    const spoken = speakPaperWords(state, 'opponent', 'Une phrase ordinaire.')
    expect(spoken.player.heardWords).toBeUndefined()
    expect(spoken.player.hanzoProjection).toBeTruthy()
    const called = callHanzoBody(state, 'opponent')
    expect(called.player.hanzoProjection).toBeUndefined()
    expect(called.player.x).toBe(20)
    expect(called.player.health).toBe(state.player.health)
  })
  it('requires the prepared double and retains actual loss of speech or autonomy', () => {
    const state = projected()
    const startup = {
      ...state,
      player: {
        ...state.player,
        hanzoProjection: {
          ...state.player.hanzoProjection!,
          startupFrames: 1,
        },
      },
    }
    expect(voiceAvailable(startup, 'player')).toBe(false)
    const mute = {
      ...state,
      player: {
        ...state.player,
        hatsuEffects: {
          ...state.player.hatsuEffects,
          senseSeals: 4,
        },
      },
    }
    expect(speakPaperWords(mute, 'player', 'Rien.')).toBe(mute)
    expect(
      voiceAvailable(
        {
          ...state,
          player: {
            ...state.player,
            arsenalSleep: {
              owner: 'opponent',
              cause: 'cookie',
            },
          },
        },
        'player',
      ),
    ).toBe(false)
  })
  it('does not move planted listening paper from the real body onto the double', () => {
    const base = projected('kalluto')
    const state: FightState = {
      ...base,
      player: { ...base.player, plantedPaper: [{ owner: 'opponent', zone: 'torso' }] },
      opponent: {
        ...base.opponent,
        kallutoPaper: { zone: 'torso', doll: { target: 'player', createdAt: 0 } },
      },
    }
    const farVoice = speakPaperWords(state, 'player', 'Ma voix est loin du papier.')
    expect(farVoice.opponent.kallutoPaper?.heard).toBeUndefined()
    expect(farVoice.opponent.heardWords?.text).toBe('Ma voix est loin du papier.')
    const nearVoice = speakPaperWords(
      { ...state, opponent: { ...state.opponent, x: 25 } },
      'opponent',
      'Près du corps.',
    )
    expect(nearVoice.opponent.kallutoPaper?.heard?.text).toBe('Près du corps.')
  })
  it('records the audible double at its own location without identifying it as footage of the physical body', () => {
    let state = projected()
    state = cameraAt(state, 'player:device:camera', 65)
    state = cameraAt(state, 'opponent:device:camera', 15)
    const spoken = speakPaperWords(state, 'player', {
      text: 'Une voix du double.',
      statementIntent: false,
    })
    expect(camera(spoken).words?.at(-1)).toMatchObject({
      text: 'Une voix du double.',
      projection: true,
      visibleBody: true,
    })
    expect(camera(spoken).words?.at(-1)?.bodyKey).toBeUndefined()
    expect(camera(spoken, 'opponent:device:camera').words).toBeUndefined()
    expect(spoken.player.hanzoProjection?.bodyX).toBe(20)
  })
  it('films both visible vessels and preserves their recorded positions through snapshots and P2 presentation', () => {
    let state = projected()
    state = cameraAt(state, 'player:device:camera', 15)
    state = { ...state, frame: 30, player: { ...state.player, x: 35 } }
    const filmed = advanceDeviceRecordings(state)
    const pictures = camera(filmed).pictures!.filter((p) => p.subject === 'player')
    expect(pictures).toHaveLength(2)
    expect(pictures.find((p) => !p.projection)?.x).toBe(20)
    expect(pictures.find((p) => p.projection)?.x).toBe(35)
    expect(
      fightReplayHash(
        decodeFightSnapshot(encodeFightSnapshot(filmed), {
          player: 'hanzo',
          opponent: 'basho',
          mode: filmed.mode,
          formatId: filmed.formatId,
          environment: filmed.environment,
        }),
      ),
    ).toBe(fightReplayHash(filmed))
    const p2 = privatePvpState(filmed, 'opponent')
    expect(p2.opponent.hanzoProjection?.bodyX).toBe(20)
  })
})
