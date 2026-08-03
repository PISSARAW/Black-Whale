import type { ArenaMechanic } from '@black-whale/nen-engine'
import type { ArenaHatsuDefinition } from './contract'
import { ARENA_CONTRACTS } from './contracts.gen'

/**
 * The Black Whale roster: the twenty-four hatsu the arena mode is built around.
 *
 * The contracts themselves are no longer here — they are declared by the
 * modules and compiled into `contracts.gen.ts`. What the roster is, though, is
 * the arena's own affair, and it is legible in the contracts: a hatsu belongs
 * to it when it brings a `mechanic` no other brings. The four abilities the
 * mode inherited from the earlier arcs are cast in duels but individualise
 * nothing, so they declare none.
 */
export interface BlackWhaleArenaContract extends ArenaHatsuDefinition {
  mechanic: ArenaMechanic
}

export const BLACK_WHALE_ARENA_CONTRACTS: BlackWhaleArenaContract[] = ARENA_CONTRACTS.filter(
  (contract): contract is BlackWhaleArenaContract => contract.mechanic !== undefined,
)
