import type { HatsuInteractionKind, HatsuProfile } from '$lib/nen/hatsuRegistry'
import type { ArenaHatsuEffect } from '../combat/types'
import { arenaDefinition } from './hatsu/contract'

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
  animate: 'enhance',
  predator: 'enhance',
  future: 'enhance',
  inherit: 'enhance',
  infection: 'enhance',
  'blood-search': 'bind',
  'truth-punch': 'impact',
  'damage-transfer': 'restore',
  'legal-defense': 'bind',
  spatial: 'enhance',
  surveillance: 'enhance',
  growth: 'restore',
  projection: 'enhance',
  snakes: 'barrage',
  'chain-rule': 'bind',
  'ability-loan': 'enhance',
  theft: 'enhance',
  'pain-armour': 'impact',
  vacuum: 'bind',
  stitch: 'restore',
  needle: 'bind',
  'post-mortem': 'restore',
  resurrection: 'restore',
}

export function arenaHatsuEffect(profile: HatsuProfile | null): ArenaHatsuEffect | null {
  return arenaDefinition(profile)?.effect ?? (profile ? (EFFECTS[profile.kind] ?? null) : null)
}

export function worksInArena(kind: HatsuInteractionKind): boolean {
  return EFFECTS[kind] !== undefined
}
