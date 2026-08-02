import type { HatsuInteractionKind, HatsuProfile } from '$lib/nen/hatsuRegistry'
import type { ArenaHatsuEffect } from '../combat/types'

const EFFECTS: Partial<Record<HatsuInteractionKind, ArenaHatsuEffect>> = {
  elastic: 'bind',
  impact: 'impact',
  windup: 'impact',
  'remote-strike': 'barrage',
  barrage: 'barrage',
  restoration: 'restore',
  healing: 'restore',
  enhance: 'enhance',
  rhythm: 'enhance',
}

export function arenaHatsuEffect(profile: HatsuProfile | null): ArenaHatsuEffect | null {
  return profile ? (EFFECTS[profile.kind] ?? null) : null
}

export function worksInArena(kind: HatsuInteractionKind): boolean {
  return EFFECTS[kind] !== undefined
}
