import { afterEach, describe, expect, it } from 'vitest'
import { activeHatsu } from '$lib/nen/hatsuState'
import { hatsuById } from '$lib/nen/hatsuRegistry'
import { morenaDockLoadout } from './morenaHatsuAdapter'

afterEach(() => activeHatsu.set(null))

describe('canonical Morena dock loadout', () => {
  it('carries a compatible active Hatsu into the canonical deal', () => {
    activeHatsu.set(hatsuById('emperor-time')!)
    expect(morenaDockLoadout()).toEqual({ tableKind: 'scarlet', carryingBook: false })
  })

  it('opens Double Face and ignores incompatible techniques', () => {
    activeHatsu.set(hatsuById('double-face')!)
    expect(morenaDockLoadout()).toEqual({ tableKind: null, carryingBook: true })
    activeHatsu.set(hatsuById('bungee-gum')!)
    expect(morenaDockLoadout()).toEqual({ tableKind: null, carryingBook: false })
  })
})
