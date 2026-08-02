import { describe, expect, it } from 'vitest'
import { bungeeGum } from '@black-whale/ability-modules'
import { BUNGEE_GUM_HUNT, DEFAULT_HUNT_HATSU, huntHatsu } from './hatsu'

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
})
