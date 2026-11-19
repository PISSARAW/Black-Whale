import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from './engine'
import { deviceAi } from './deviceAi'
import { deviceNavigation } from './deviceNavigation'
import { deviceEntity, changeDevice } from './physicalDevices'
import { performArsenalCommand } from './retrospectiveArsenal'
import { EMPTY_INPUT, type FightState } from './types'

function setup(): FightState {
  const base = beginFight(
    createFight('theta', 'hinrigh', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { preparation: { mode: 'scenario', resources: ['devices'], cohorts: [] } },
    }),
  )
  return {
    ...base,
    player: { ...base.player, x: 25 },
    opponent: { ...base.opponent, x: 65, aura: 100 },
  }
}
function advance(state: FightState, count = 18) {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
  return state
}
function removeExcept(state: FightState, kind: string) {
  return {
    ...state,
    battlefield: {
      ...state.battlefield!,
      entities: state.battlefield!.entities.filter((e) => e.device?.kind === kind),
    },
  }
}

describe('Biohazard AI prepares real scenario equipment', () => {
  it('walks normally toward an untouched camera and cannot teleport, invent gear, or transform under On', () => {
    const state = setup(),
      actor = deviceNavigation(state, state.opponent)!
    expect(actor.x).toBeGreaterThan(65)
    expect(actor.x).toBeLessThan(66)
    expect(actor.aura).toBe(100)
    expect(deviceNavigation({ ...state, battlefield: undefined }, state.opponent)).toBeNull()
    expect(
      deviceNavigation(state, { ...state.opponent, nen: { ...state.opponent.nen, on: true } }),
    ).toBeNull()
    expect(deviceNavigation(state, { ...state.opponent, x: 30 })).toBeNull()
  })
  it('actually transforms a gun and fires its finite stock', () => {
    const base = removeExcept(setup(), 'firearm')
    let state: FightState = { ...base, opponent: { ...base.opponent, x: 78 } }
    state = deviceAi(state)!
    expect(state.opponent.deviceTouchId).toBe('opponent:device:firearm')
    state = advance(state)
    const fired = deviceAi(state)!
    expect(fired.projectiles).toHaveLength(1)
    expect(deviceEntity(fired, 'opponent:device:firearm')?.device?.ammunition).toBe(5)
    state = changeDevice(fired, deviceEntity(fired, 'opponent:device:firearm')!, { ammunition: 0 })
    state = { ...state, opponent: { ...state.opponent, arenaRecovery: 0 } }
    expect(deviceAi(state)).toBeNull()
  })
  it('transforms, swallows, physically deposits, and reads the actual transmitter', () => {
    let state = setup()
    state = {
      ...state,
      opponent: {
        ...state.opponent,
        x: 79,
        devicePlayback: { deviceId: 'old', viewedAt: 0, pictures: [], words: [] },
      },
    }
    state = changeDevice(state, deviceEntity(state, 'opponent:device:camera')!, { recording: true })
    state = changeDevice(state, deviceEntity(state, 'opponent:device:firearm')!, { ammunition: 0 })
    state = deviceAi(state)!
    expect(state.opponent.deviceTouchId).toBe('opponent:device:transmitter')
    state = advance(state)
    state = deviceAi(state)!
    expect(deviceEntity(state, 'opponent:device:transmitter')?.device?.swallowed).toBe(true)
    state = performArsenalCommand(state, 'opponent', {
      action: 'device-pickup',
      target: 'opponent:device:receiver',
    })
    state = { ...state, opponent: { ...state.opponent, x: 52 } }
    state = deviceAi(state)!
    expect(deviceEntity(state, 'opponent:device:transmitter')?.device?.swallowed).toBe(false)
    expect(deviceEntity(state, 'opponent:device:transmitter')?.x).toBe(52)
    state = deviceAi(state)!
    expect(state.opponent.receiverReading?.x).toBe(52)
    expect(deviceEntity(state, 'opponent:device:transmitter')?.device?.swallowed).toBe(false)
  })
})
