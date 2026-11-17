import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from './engine'
import { performArsenalCommand, arsenalOptions } from './retrospectiveArsenal'
import { deviceEntity, changeDevice, devicePosition } from './physicalDevices'
import { speakPaperWords } from './kallutoListening'
import { privatePvpState } from './pvp/view'
import { fightReplayHash } from './fightReplayHash'
import { OYSTER_AURA_FRAMES, DEVICE_TRANSFORM_FRAMES } from './deviceTypes'
import { createKurapika } from './kurapika'
import { EMPTY_INPUT, type FightState, type FighterId } from './types'

const ID = (kind: string) => `player:device:${kind}`
function ready(player: FighterId = 'hinrigh'): FightState {
  const state = beginFight(
    createFight(player, 'theta', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { preparation: { mode: 'scenario', resources: ['devices'], cohorts: [] } },
    }),
  )
  return {
    ...state,
    player: { ...state.player, x: 25, aura: 100, facing: 1 },
    opponent: { ...state.opponent, x: 40, facing: -1 },
  }
}
function command(
  state: FightState,
  action: Parameters<typeof performArsenalCommand>[2]['action'],
  kind: string,
  side: 'player' | 'opponent' = 'player',
) {
  return performArsenalCommand(state, side, { action, target: ID(kind) })
}
function frames(state: FightState, count = DEVICE_TRANSFORM_FRAMES) {
  for (let n = 0; n < count; n++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
  return state
}
function transformed(kind: string, state = ready()): FightState {
  const start = command(state, 'biohazard-device', kind)
  expect(deviceEntity(start, ID(kind))?.device?.transforming).toBeTruthy()
  return frames(start)
}

describe('Biohazard preserves the actual touched device and its original function', () => {
  it('requires supplied physical devices and spends aura without conjuring an inventory', () => {
    const empty = beginFight(createFight('hinrigh', 'theta', { mode: 'versus-local' }))
    expect(command(empty, 'biohazard-device', 'camera')).toBe(empty)
    const state = ready(),
      hash = fightReplayHash(state)
    expect(
      arsenalOptions(state, 'player').some((o) => o.command.action === 'biohazard-device'),
    ).toBe(true)
    expect(fightReplayHash(state)).toBe(hash)
    const start = command(state, 'biohazard-device', 'camera')
    expect(start.player.aura).toBe(80)
    expect(start.battlefield?.entities).toHaveLength(state.battlefield!.entities.length)
    expect(deviceEntity(start, ID('camera'))?.device?.form).toBeUndefined()
    expect(deviceEntity(frames(start), ID('camera'))?.device?.form?.kind).toBe('cat')
  })
  it('interrupts transformation when touch, position or the free body is lost', () => {
    const started = command(ready(), 'biohazard-device', 'camera')
    for (const patch of [
      { x: 45 },
      { hitStun: 10 },
      { hatsuEffects: { ...started.player.hatsuEffects, forcedZetsuFrames: 30 } },
    ]) {
      const stopped = frames({ ...started, player: { ...started.player, ...patch } }, 1)
      expect(deviceEntity(stopped, ID('camera'))?.device?.transforming).toBeUndefined()
      expect(deviceEntity(stopped, ID('camera'))?.device?.form).toBeUndefined()
      expect(stopped.player.aura).toBeLessThan(81)
    }
  })
  it('keeps recording real bodies and speech as a cat, then reads the actual camera at hand contact', () => {
    let state = command(ready(), 'device-record', 'camera')
    state = transformed('camera', state)
    state = speakPaperWords(state, 'opponent', 'Je suis au quai.')
    const camera = deviceEntity(state, ID('camera'))!
    expect(camera.device?.form?.kind).toBe('cat')
    expect(camera.device?.pictures?.some((p) => p.appearance === 'theta')).toBe(true)
    expect(camera.device?.words?.at(-1)?.text).toBe('Je suis au quai.')
    const remote = { ...state, player: { ...state.player, x: 70 } }
    expect(command(remote, 'device-watch', 'camera')).toBe(remote)
    const watched = command(state, 'device-watch', 'camera')
    expect(watched.player.devicePlayback?.words.at(-1)?.text).toBe('Je suis au quai.')
    expect(watched.opponent.devicePlayback).toBeUndefined()
  })
  it('moves only the actual free camera-cat and continues recording after a physical reversion', () => {
    let state = transformed('camera')
    state = command(state, 'device-record', 'camera')
    state = command(state, 'biohazard-cat-right', 'camera')
    state = frames(state, 30)
    expect(deviceEntity(state, ID('camera'))!.x).toBeGreaterThan(28)
    state = command(state, 'biohazard-device-end', 'camera')
    expect(deviceEntity(state, ID('camera'))?.device?.form).toBeUndefined()
    expect(deviceEntity(state, ID('camera'))?.device?.recording).toBe(true)
    expect(deviceEntity(state, ID('camera'))?.device?.pictures?.length).toBeGreaterThan(0)
  })
  it('uses the same six real bullets through the snake firearm, without creating Nen ammunition', () => {
    let state = transformed('firearm')
    const startingAura = state.player.aura
    expect(deviceEntity(state, ID('firearm'))?.device?.form?.kind).toBe('snake')
    for (let i = 0; i < 6; i++) {
      state = command(
        { ...state, player: { ...state.player, arenaRecovery: 0 } },
        'device-fire',
        'firearm',
      )
      expect(state.projectiles.at(-1)?.matter).toBe('object')
    }
    expect(deviceEntity(state, ID('firearm'))?.device?.ammunition).toBe(0)
    const exhausted = { ...state, player: { ...state.player, arenaRecovery: 0 } }
    expect(command(exhausted, 'device-fire', 'firearm')).toBe(exhausted)
    expect(exhausted.player.aura).toBe(startingAura)
    expect(exhausted.projectiles).toHaveLength(6)
  })
  it('does not let an ordinary unheld firearm shoot, but permits a held real gun under On or Zetsu', () => {
    const state = ready('theta')
    expect(command(state, 'device-fire', 'firearm')).toBe(state)
    const held = command(state, 'device-pickup', 'firearm')
    const on = { ...held, player: { ...held.player, nen: { ...held.player.nen, on: true } } }
    const fired = command(on, 'device-fire', 'firearm')
    expect(fired.projectiles).toHaveLength(1)
    expect(fired.player.nen.on).toBe(true)
    expect(fired.player.aura).toBe(on.player.aura)
    expect(deviceEntity(fired, ID('firearm'))?.device?.ammunition).toBe(5)
  })
  it('carries the two-hour oyster in the real body and reports its last measured position through a real receiver', () => {
    let state = transformed('transmitter')
    expect(deviceEntity(state, ID('transmitter'))?.device?.form?.remainingFrames).toBe(
      OYSTER_AURA_FRAMES,
    )
    state = command(state, 'biohazard-swallow', 'transmitter')
    expect(deviceEntity(state, ID('transmitter'))?.device?.swallowed).toBe(true)
    state = command(state, 'device-pickup', 'receiver')
    state = { ...state, player: { ...state.player, x: 63 } }
    state = command(state, 'device-signal', 'receiver')
    expect(state.player.receiverReading?.x).toBe(63)
    const previous = state.player.receiverReading
    state = { ...state, player: { ...state.player, x: 70 } }
    expect(state.player.receiverReading).toBe(previous)
    state = command(state, 'biohazard-place', 'transmitter')
    expect(deviceEntity(state, ID('transmitter'))?.device?.carrier).toBeUndefined()
    expect(deviceEntity(state, ID('transmitter'))!.x).toBe(70)
    expect(devicePosition(state, deviceEntity(state, ID('transmitter'))!).x).toBe(70)
  })
  it('expires stored oyster aura through hitstop without teleporting an ingested physical transmitter out of the body', () => {
    let state = command(transformed('transmitter'), 'biohazard-swallow', 'transmitter')
    const device = deviceEntity(state, ID('transmitter'))!
    state = changeDevice(state, device, { form: { ...device.device!.form!, remainingFrames: 2 } })
    state = frames({ ...state, hitstop: 2 }, 2)
    const expired = deviceEntity(state, ID('transmitter'))!
    expect(expired.device?.form).toBeUndefined()
    expect(expired.device?.carrier).toBe('player')
    expect(expired.device?.swallowed).toBe(true)
    expect(expired.device?.batteryFrames).toBeGreaterThan(0)
  })
  it('copies only Biohazard, then requires a real device and keeps a borrowed one-use transformation loaded', () => {
    const base = ready('chrollo'),
      book = { pages: ['hinrigh:neutralSpecial' as const], page: 0, bookmark: null, open: true }
    expect(
      deviceEntity(
        transformed('camera', { ...base, player: { ...base.player, chrolloBook: book } }),
        ID('camera'),
      )?.device?.form?.kind,
    ).toBe('cat')
    const owner = ready('kurapika'),
      chain = createKurapika()
    const borrowed = {
      ...owner,
      player: {
        ...owner.player,
        kurapika: {
          ...chain,
          emperorTime: true,
          held: {
            victim: 'opponent' as const,
            source: 'hinrigh' as const,
            moveId: 'hinrigh:neutralSpecial',
            loaded: true,
            used: false,
            sustainedKeys: [],
          },
        },
      },
    }
    const used = transformed('camera', borrowed)
    expect(used.player.kurapika?.held?.used).toBe(true)
    expect(used.player.kurapika?.emperorTime).toBe(true)
    expect(command(used, 'biohazard-device', 'firearm')).toBe(used)
  })
  it('redacts raw camera memory and keeps playback on the authenticated viewer only', () => {
    let state = command(ready(), 'device-record', 'camera')
    state = speakPaperWords(frames(state, 15), 'opponent', 'Au quai.')
    state = command(state, 'device-watch', 'camera')
    expect(
      deviceEntity(privatePvpState(state, 'player'), ID('camera'))?.device?.words,
    ).toBeUndefined()
    expect(privatePvpState(state, 'player').player.devicePlayback?.words.at(-1)?.text).toBe(
      'Au quai.',
    )
    expect(privatePvpState(state, 'opponent').opponent.devicePlayback).toBeUndefined()
    expect(deviceEntity(state, ID('camera'))?.device?.words?.length).toBeGreaterThan(0)
  })
})
