import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from './engine'
import { performArsenalCommand } from './retrospectiveArsenal'
import { deviceEntity } from './physicalDevices'
import { biohazardCanLaunch } from './biohazard'
import { DEVICE_TRANSFORM_FRAMES } from './deviceTypes'
import { nextFightRound } from './fightState'
import { parseHinrighKit, type HinrighKit } from './hinrighKit'
import type { FightPreparation } from './preparationTypes'
import { EMPTY_INPUT, type FightState } from './types'

function kitDuel(preparation: Partial<FightPreparation> & { hinrighKit?: HinrighKit }): FightState {
  const state = beginFight(
    createFight('hinrigh', 'theta', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { preparation: { mode: 'duel', resources: [], cohorts: [], ...preparation } },
    }),
  )
  return {
    ...state,
    player: { ...state.player, x: 25, aura: 100, facing: 1 },
    opponent: { ...state.opponent, x: 40, facing: -1 },
  }
}
const devices = (state: FightState, side = 'player') =>
  state
    .battlefield!.entities.filter((entry) => entry.kind === 'device' && entry.owner === side)
    .map((entry) => entry.device!.kind)
    .sort()
function frames(state: FightState, count: number): FightState {
  for (let n = 0; n < count; n++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
  return state
}

describe('Hinrigh packs a real inventory before the fight', () => {
  it('keeps the default carried kit when nothing was packed', () => {
    const state = kitDuel({})
    expect(state.player.biohazard?.objects).toHaveLength(2)
    expect(state.player.biohazardDevices?.map((item) => item.kind)).toEqual([
      'camera',
      'transmitter',
    ])
    expect(devices(state)).toEqual([])
  })

  it('installs only the packed objects, with their own limits, even in a plain duel', () => {
    const state = kitDuel({ hinrighKit: { player: ['firearm', 'transmitter'] } })
    expect(state.player.biohazard?.objects).toEqual([])
    expect(biohazardCanLaunch(state.player)).toBe(false)
    expect(state.player.biohazardDevices).toBeUndefined()
    expect(devices(state)).toEqual(['firearm', 'receiver', 'transmitter'])
    expect(deviceEntity(state, 'player:device:firearm')?.device?.ammunition).toBe(6)
  })

  it('packed handcuffs are the only pairs that can become birds', () => {
    const state = kitDuel({ hinrighKit: { player: ['handcuffs', 'camera'] } })
    expect(state.player.biohazard?.objects).toHaveLength(2)
    expect(biohazardCanLaunch(state.player)).toBe(true)
    expect(devices(state)).toEqual(['camera'])
  })

  it('replaces the generic scenario devices of that side only', () => {
    const state = kitDuel({
      mode: 'scenario',
      resources: ['devices'],
      hinrighKit: { player: ['camera'] },
    })
    expect(devices(state)).toEqual(['camera'])
    expect(devices(state, 'opponent')).toEqual(['camera', 'firearm', 'receiver', 'transmitter'])
  })

  it('turns the packed gun into a snake that keeps its six rounds', () => {
    let state = kitDuel({ hinrighKit: { player: ['firearm'] } })
    state = performArsenalCommand(state, 'player', {
      action: 'biohazard-device',
      target: 'player:device:firearm',
    })
    state = frames(state, DEVICE_TRANSFORM_FRAMES)
    const snake = deviceEntity(state, 'player:device:firearm')!
    expect(snake.device!.form?.kind).toBe('snake')
    expect(snake.device!.ammunition).toBe(6)
  })

  it('packs the same kit again for the next round, without carrying extra objects', () => {
    const state = kitDuel({ hinrighKit: { player: ['transmitter'] } })
    const next = nextFightRound({ ...state, phase: 'finished', matchWinner: null })
    expect(next.player.biohazard?.objects).toEqual([])
    expect(devices(next)).toEqual(['receiver', 'transmitter'])
  })

  it('rejects kits that are too large, duplicated, unknown or for an unknown side', () => {
    expect(parseHinrighKit(undefined)).toBeUndefined()
    expect(parseHinrighKit({ player: ['camera', 'handcuffs'] })).toEqual({
      player: ['camera', 'handcuffs'],
    })
    expect(parseHinrighKit({ player: ['camera', 'firearm', 'handcuffs', 'transmitter'] })).toBe(
      null,
    )
    expect(parseHinrighKit({ player: ['camera', 'camera'] })).toBe(null)
    expect(parseHinrighKit({ player: ['ammunition'] })).toBe(null)
    expect(parseHinrighKit({ referee: ['camera'] })).toBe(null)
    expect(parseHinrighKit(['camera'])).toBe(null)
  })
})
