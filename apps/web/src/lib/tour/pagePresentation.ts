import type { Ship } from './blueprint'
import type { Provenance } from './types'

export interface LocalizedName {
  name: string
  nameFr: string
}

export interface LocalizedSource {
  source: string
  sourceFr: string
}

const PROVENANCE_CLASS: Record<Provenance, string> = {
  panel: 'border-[#FFD700]/60 bg-[#FFD700]/10 text-[#FFD700]',
  plan: 'border-[#FFFFF0]/30 bg-[#FFFFF0]/5 text-[#FFFFF0]/80',
  map: 'border-[#5f8f6a] bg-[#5f8f6a]/20 text-[#8fd0a0]',
  inferred: 'border-[#2b3a4a] bg-[#2b3a4a]/30 text-[#9dc4e0]',
}

export function localizedName(entity: LocalizedName, french: boolean): string {
  return french ? entity.nameFr : entity.name
}

export function localizedSource(entity: LocalizedSource, french: boolean): string {
  return french ? entity.sourceFr : entity.source
}

export function provenanceClass(thing: { provenance: Provenance }): string {
  return PROVENANCE_CLASS[thing.provenance]
}

/** Bow-to-stern length of the widest reconstructed deck. */
export function shipLength(ship: Ship): number {
  const lengths = ship.decks.map((tier) => {
    const positions = tier.hull.map((point) => point[1])
    return Math.max(...positions) - Math.min(...positions)
  })
  return Math.round(Math.max(...lengths))
}
