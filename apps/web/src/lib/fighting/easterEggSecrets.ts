import { easterEggDefinition, eggBit, type EasterEggSlot } from './easterEggCatalogue'
import type { EasterEggSecret } from './easterEggTypes'
import type { FightSide, FightState, FighterId } from './types'

const TROUPE: readonly FighterId[] = [
  'hisoka',
  'chrollo',
  'feitan',
  'phinks',
  'franklin',
  'machi',
  'illumi',
  'kalluto',
  'bonolenov',
  'shizuku',
]

export function easterEggSecretRequirement(id: FighterId): EasterEggSecret {
  const authored = easterEggDefinition(id, 4)?.secret
  if (authored) return authored
  if (id === 'kurapika') return { kind: 'opponent', fighters: TROUPE }
  if (id === 'rihan') return { kind: 'gesture', slot: 3 }
  return { kind: 'sequence' }
}

export function easterEggSecretReady(state: FightState, side: FightSide): boolean {
  const fighter = state[side]
  const secret = easterEggSecretRequirement(fighter.id)
  if (secret.kind === 'opponent')
    return secret.fighters.includes(state[side === 'player' ? 'opponent' : 'player'].id)
  if (secret.kind === 'gesture')
    return Boolean((fighter.easterEggDiscoveries ?? 0) & eggBit(secret.slot))
  return (fighter.easterEggSequence ?? 0) === 3
}

/** Preview admission changes only a separate sandbox's target, never the live duel. */
export function easterEggPreviewOpponent(options: {
  fighterId: FighterId
  opponentId: FighterId
  slot: EasterEggSlot
}): FighterId {
  const secret = easterEggSecretRequirement(options.fighterId)
  return options.slot === 4 && secret.kind === 'opponent' ? secret.fighters[0] : options.opponentId
}
