import type { ArenaContract } from '@black-whale/nen-engine'
import type { ArenaHatsuEffect } from '../../combat/types'
import type { HatsuProfile } from '../../nen/hatsuRegistry'
import { ARENA_CONTRACTS } from './contracts.gen'

/**
 * What the arena charges for a hatsu, and what the caster exposes by using it.
 *
 * These twenty-eight contracts used to be written here and in `blackWhale.ts`,
 * beside modules that already enforced the very conditions they named — the
 * sixth declaration of the catalogue ADR-001 counts. They are now declared in
 * each module's `arena` block and compiled into `contracts.gen.ts`; what stays
 * here is the lookup and the duel's own vocabulary.
 */

/**
 * The engine's contract, restated in the duel's terms. The `effect` field is
 * deliberately typed by `combat/types` rather than re-exported from the engine:
 * the reducer switches on these five words, so the day the two vocabularies
 * disagree the compiled table stops being assignable here — a type error
 * rather than a cast nobody notices.
 */
export interface ArenaHatsuDefinition extends Omit<ArenaContract, 'effect'> {
  effect: ArenaHatsuEffect
}

export function arenaDefinition(profile: HatsuProfile | null): ArenaHatsuDefinition | null {
  if (!profile) return null
  return ARENA_CONTRACTS.find((contract) => contract.id === profile.id) ?? null
}
