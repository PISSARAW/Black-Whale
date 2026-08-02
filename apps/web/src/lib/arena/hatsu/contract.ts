import type { ArenaHatsuEffect } from '../../combat/types'
import type { HatsuProfile } from '../../nen/hatsuRegistry'

export interface ArenaHatsuDefinition {
  id: string
  effect: ArenaHatsuEffect
  cost: number
  persistent: boolean
}

export function arenaDefinition(profile: HatsuProfile | null): ArenaHatsuDefinition | null {
  if (!profile) return null
  if (profile.id === 'bungee-gum') {
    return { id: profile.id, effect: 'bind', cost: 18, persistent: true }
  }
  return null
}
