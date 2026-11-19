import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { copyHistoricalObject, stampHistoricalPuppet } from './chrolloHistoricalObjects'
import { performArsenalCommand } from './retrospectiveArsenal'
import { voiceTarget } from './blackVoiceTargets'
import type { FightState } from './types'

const OITO = 'person:queen-oito'
function scene(page: 'gallery-fake' | 'black-voice'): FightState {
  const state = beginFight(
    createFight('chrollo', 'hisoka', {
      mode: 'versus-local',
      environment: { preparation: { mode: 'scenario', resources: ['people'], cohorts: [] } },
    }),
  )
  return {
    ...state,
    player: {
      ...state.player,
      x: 22,
      aura: 100,
      chrolloBook: { pages: [page, 'order-stamp'], page: 0, open: false, bookmark: page },
    },
  }
}
describe('the unawakened recipient remains a real person rather than an inert prop', () => {
  it('copies her physical likeness without life, aura nodes, an equipped loan or a new controllable person', () => {
    const initial = scene('gallery-fake')
    const copied = copyHistoricalObject(initial, 'player', OITO)
    const replica = copied.battlefield!.entities.find((entry) => entry.copy)!
    expect(replica.kind).toBe('puppet')
    expect(replica.copy!.appearanceModel).toBe('queen-oito')
    expect(replica.copy!.originalId).toBe(OITO)
    expect(replica.arena).toEqual({ width: 2.2, height: 13 })
    expect(replica.person).toBeUndefined()
    expect(replica.controller).toBeUndefined()
    expect(copied.battlefield!.entities.filter((entry) => entry.person)).toHaveLength(1)
    const both = {
      ...copied,
      player: {
        ...copied.player,
        chrolloBook: { ...copied.player.chrolloBook!, open: true, page: 1 },
      },
    }
    const stamped = stampHistoricalPuppet(both, 'player', replica.id)
    expect(
      stamped.battlefield!.entities.find((entry) => entry.id === replica.id)!.copy!.order,
    ).toBe('attack')
    expect(stamped.battlefield!.entities.find((entry) => entry.id === OITO)!.person!.nen).toBe(
      'closed',
    )
  })
  it('allows Black Voice to implant the real living human with its original antenna, but not her inert Gallery Fake copy', () => {
    const initial = scene('black-voice')
    expect(voiceTarget(initial, OITO)?.entity?.person?.identity).toBe('queen-oito')
    const armed = performArsenalCommand(initial, 'player', { action: 'voice-arm' })
    const planted = performArsenalCommand(armed, 'player', {
      action: 'voice-implant',
      target: OITO,
    })
    expect(
      planted.battlefield!.entities.find((entry) => entry.id === OITO)!.blackVoiceControl,
    ).toBeDefined()
    const phone = performArsenalCommand(planted, 'player', { action: 'voice-phone' })
    const controlled = performArsenalCommand(phone, 'player', {
      action: 'voice-retreat',
      target: OITO,
    })
    expect(
      controlled.battlefield!.entities.find((entry) => entry.id === OITO)!.blackVoiceControl!
        .active,
    ).toBe(true)
    const copied = copyHistoricalObject(scene('gallery-fake'), 'player', OITO)
    const replica = copied.battlefield!.entities.find((entry) => entry.copy)!
    const source = {
      ...copied,
      player: {
        ...copied.player,
        chrolloBook: { pages: ['black-voice' as const], page: 0, open: true, bookmark: null },
      },
    }
    const secondPin = performArsenalCommand(source, 'player', { action: 'voice-arm' })
    expect(
      performArsenalCommand(secondPin, 'player', { action: 'voice-implant', target: replica.id }),
    ).toBe(secondPin)
  })
})
