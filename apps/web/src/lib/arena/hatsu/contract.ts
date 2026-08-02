import type { ArenaHatsuEffect } from '../../combat/types'
import type { HatsuProfile } from '../../nen/hatsuRegistry'

export interface ArenaHatsuDefinition {
  id: string
  effect: ArenaHatsuEffect
  cost: number
  persistent: boolean
  condition: string
  risk: string
}

export function arenaDefinition(profile: HatsuProfile | null): ArenaHatsuDefinition | null {
  if (!profile) return null
  if (profile.id === 'bungee-gum') {
    return {
      id: profile.id,
      effect: 'bind',
      cost: 18,
      persistent: true,
      condition: 'anchor-or-contact',
      risk: 'tether-counterforce',
    }
  }
  if (profile.id === 'ripper-cyclotron') {
    return {
      id: profile.id,
      effect: 'impact',
      cost: 6,
      persistent: true,
      condition: 'consecutive-windup',
      risk: 'sequence-reset',
    }
  }
  if (profile.id === 'double-machine-gun') {
    return {
      id: profile.id,
      effect: 'barrage',
      cost: 18,
      persistent: false,
      condition: 'clear-line',
      risk: 'recovery-window',
    }
  }
  if (profile.id === 'battle-cantabile-jupiter') {
    return {
      id: profile.id,
      effect: 'impact',
      cost: 6,
      persistent: true,
      condition: 'three-beat-sequence',
      risk: 'rhythm-break',
    }
  }
  return null
}
