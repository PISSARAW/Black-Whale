import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, tickFight } from './engine'
import { createTeamFight, requestTeamAssist } from './teamMatch'
import { performArsenalCommand } from './retrospectiveArsenal'
import { deviceEntity, devicePosition } from './physicalDevices'
import { deviceAi } from './deviceAi'
import { createDeviceScene } from './deviceScene'
import { EMPTY_INPUT, type FightState, type FighterId } from './types'

const id = (kind: string) => `player:device:${kind}`
function setup(player: FighterId = 'hinrigh'): FightState {
  const base = beginFight(
    createFight(player, 'theta', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { preparation: { mode: 'scenario', resources: ['devices'], cohorts: [] } },
    }),
  )
  return {
    ...base,
    player: { ...base.player, x: 25, aura: 100 },
    opponent: { ...base.opponent, x: 40 },
  }
}
function use(
  state: FightState,
  action: Parameters<typeof performArsenalCommand>[2]['action'],
  kind: string,
) {
  return performArsenalCommand(state, 'player', { action, target: id(kind) })
}
function advance(state: FightState, count = 18) {
  for (let n = 0; n < count; n++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
  return state
}

describe('physical device boundaries stay consistent with the actual bodies', () => {
  it('keeps both hands finite and counts the open book without copying equipment', () => {
    let state = setup('theta')
    state = use(state, 'device-pickup', 'camera')
    state = use(state, 'device-pickup', 'firearm')
    expect(deviceEntity(state, id('camera'))?.device?.hand).toBe('right')
    expect(deviceEntity(state, id('firearm'))?.device?.hand).toBe('left')
    expect(use(state, 'device-pickup', 'receiver')).toBe(state)
    const freed = use(state, 'device-drop', 'camera')
    expect(
      deviceEntity(use(freed, 'device-pickup', 'receiver'), id('receiver'))?.device?.carrier,
    ).toBe('player')
    const book = use(setup('chrollo'), 'device-pickup', 'camera')
    expect(deviceEntity(book, id('camera'))?.device?.hand).toBe('left')
    expect(use(book, 'device-pickup', 'firearm')).toBe(book)
  })
  it('locks the actual touching body, permits cancelling without a refund, and clears the lock on interruption', () => {
    const state = setup(),
      started = use(state, 'biohazard-device', 'camera')
    expect(started.player.deviceTouchId).toBe(id('camera'))
    const cancelled = use(started, 'biohazard-device-cancel', 'camera')
    expect(cancelled.player.deviceTouchId).toBeUndefined()
    expect(cancelled.player.aura).toBe(80)
    expect(deviceEntity(cancelled, id('camera'))?.device?.form).toBeUndefined()
    const interrupted = advance({ ...started, player: { ...started.player, hitStun: 12 } }, 1)
    expect(interrupted.player.deviceTouchId).toBeUndefined()
    expect(deviceEntity(interrupted, id('camera'))?.device?.transforming).toBeUndefined()
  })
  it('keeps a held camera with its actual team member after a relay', () => {
    let state = beginFight(
      createTeamFight(
        {
          player: ['hinrigh', 'bill', 'melody'],
          opponent: ['theta', 'machi', 'hisoka'],
        },
        { preparation: { mode: 'scenario', resources: ['devices'], cohorts: [] } },
      ),
    )
    state = { ...state, player: { ...state.player, x: 25 }, opponent: { ...state.opponent, x: 70 } }
    state = use(state, 'device-pickup', 'camera')
    const atGate = { ...state, player: { ...state.player, x: 7 } }
    const relayed = requestTeamAssist(atGate, 'player', 1)
    expect(relayed.player.id).toBe('bill')
    expect(devicePosition(relayed, deviceEntity(relayed, id('camera'))!).x).toBeLessThan(10)
    const moved = { ...relayed, player: { ...relayed.player, x: 60 } }
    expect(devicePosition(moved, deviceEntity(moved, id('camera'))!).x).toBeLessThan(10)
    expect(use(moved, 'device-record', 'camera')).toBe(moved)
  })
  it('does not grant remote camera playback to its controller', () => {
    let state = advance(use(setup(), 'biohazard-device', 'camera'))
    state = use(state, 'device-record', 'camera')
    state = use(state, 'biohazard-cat-right', 'camera')
    state = advance(state, 60)
    expect(deviceEntity(state, id('camera'))!.x).toBeGreaterThan(30)
    expect(use(state, 'device-watch', 'camera')).toBe(state)
  })
  it('does not admit prepared utility commands through a closed-eye forecast', () => {
    const state = setup(),
      closed = { ...state, player: { ...state.player, parallelEyesClosed: true } }
    expect(use(closed, 'device-pickup', 'camera')).toBe(closed)
    expect(use(closed, 'biohazard-device', 'camera')).toBe(closed)
  })
  it('drives real recording and a vulnerable transformation from the native AI plan', () => {
    const base = setup('theta')
    let state: FightState = {
      ...base,
      opponent: { ...base.opponent, id: 'hinrigh' as const, x: 75, aura: 100 },
    }
    state = deviceAi(state)!
    expect(deviceEntity(state, 'opponent:device:camera')?.device?.recording).toBe(true)
    state = deviceAi(state)!
    expect(state.opponent.deviceTouchId).toBe('opponent:device:camera')
    expect(deviceAi(state)).toBeNull()
    state = advance(state)
    expect(deviceEntity(state, 'opponent:device:camera')?.device?.form?.kind).toBe('cat')
    expect(state.opponent.deviceTouchId).toBeUndefined()
  })
  it('shows the shared camera-cat, retains the physical object after Nen ends, and hides an ingested oyster', () => {
    const scene = new THREE.Scene(),
      effect = createDeviceScene({ THREE, scene, worldX: (x) => x * 0.1, worldY: (y) => y * 0.1 })
    let state = advance(use(setup(), 'biohazard-device', 'camera'))
    effect.sync(state, 0)
    const camera = scene.getObjectByName(`device:${id('camera')}`)!
    expect(camera.getObjectByName('visit-hatsu:biohazard')).toBeTruthy()
    expect(camera.getObjectByName('device:creature')!.visible).toBe(true)
    state = use(state, 'biohazard-device-end', 'camera')
    effect.sync(state, 1)
    expect(camera.visible).toBe(true)
    expect(camera.getObjectByName('device:original')!.visible).toBe(true)
    expect(camera.getObjectByName('device:creature')!.visible).toBe(false)
    const oyster = use(
      advance(use(state, 'biohazard-device', 'transmitter')),
      'biohazard-swallow',
      'transmitter',
    )
    effect.sync(oyster, 2)
    expect(scene.getObjectByName(`device:${id('transmitter')}`)!.visible).toBe(false)
    effect.dispose()
    expect(scene.children).toHaveLength(0)
  })
})
