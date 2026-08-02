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
  if (profile.id === 'ripper-cyclotron') {
    return { id: profile.id, effect: 'impact', cost: 6, persistent: true }
  }
  if (profile.id === 'double-machine-gun') {
    return { id: profile.id, effect: 'barrage', cost: 18, persistent: false }
  }
  if (profile.id === 'battle-cantabile-jupiter') {
    return { id: profile.id, effect: 'impact', cost: 6, persistent: true }
  }
  return null
}
