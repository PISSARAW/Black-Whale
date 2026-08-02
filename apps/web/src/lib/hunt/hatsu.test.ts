import { describe, expect, it } from 'vitest'
import { bungeeGum, PARALLEL_FUTURE_WINDOW_SECONDS } from '@black-whale/ability-modules'
import {
  BUNGEE_GUM_HUNT,
  DEFAULT_HUNT_HATSU,
  DOWSING_CHAIN_HUNT,
  huntHatsu,
  initialHatsu,
  openFuture,
  PARALLEL_FUTURE_HUNT,
  readDowsing,
  tickHatsu,
} from './hatsu'

describe('Hunt hatsu adapters', () => {
  it('takes its identity from the authoritative ability module', () => {
    expect(BUNGEE_GUM_HUNT).toMatchObject({
      id: bungeeGum.manifest.id,
      name: bungeeGum.manifest.name,
      ownerId: bungeeGum.manifest.ownerId,
      category: bungeeGum.manifest.category,
    })
  })

  it('adapts the declared masked trap action', () => {
    expect(BUNGEE_GUM_HUNT.actionId).toBe('set-trap')
    expect(
      bungeeGum
        .getActionWheel({} as never)
        .some((action: { id: string }) => action.id === 'set-trap'),
    ).toBe(true)
  })

  it('uses Bungee Gum as the first vertical-slice loadout', () => {
    expect(huntHatsu(DEFAULT_HUNT_HATSU)).toBe(BUNGEE_GUM_HUNT)
  })

  it('offers preparation, prediction and probable location as distinct roles', () => {
    expect([BUNGEE_GUM_HUNT, PARALLEL_FUTURE_HUNT, DOWSING_CHAIN_HUNT].map((p) => p.role)).toEqual([
      'prepare',
      'foresee',
      'locate',
    ])
  })

  it('uses the canonical ten-second Parallel Future window', () => {
    const opened = openFuture(initialHatsu('parallel-future'), 'salon')
    expect(opened.window).toBe(PARALLEL_FUTURE_WINDOW_SECONDS)
    expect(opened.forecastSpaceId).toBe('salon')
    expect(tickHatsu(opened, 4).window).toBe(6)
  })

  it('keeps dowsing probable and directional rather than naming a room', () => {
    const read = readDowsing(initialHatsu('dowsing-chain'), [0, 1])
    expect(read.probableBearing).toEqual([0, 1])
    expect(read.forecastSpaceId).toBeNull()
  })
})
