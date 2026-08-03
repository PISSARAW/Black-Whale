import type { ArenaHatsuEffect } from '../../combat/types'

export type HatsuCounter = 'gyo' | 'ken' | 'evade' | 'distance' | 'interrupt'

export interface HatsuInteraction {
  effect: ArenaHatsuEffect
  counter: HatsuCounter
  outcome: 'countered' | 'reduced' | 'exposed'
  explanationFr: string
  explanationEn: string
}

const INTERACTIONS: HatsuInteraction[] = [
  {
    effect: 'bind',
    counter: 'distance',
    outcome: 'countered',
    explanationFr: "L'ancrage est hors de portée.",
    explanationEn: 'The anchor is out of range.',
  },
  {
    effect: 'bind',
    counter: 'interrupt',
    outcome: 'exposed',
    explanationFr: 'Le lien persiste mais son porteur est interrompu.',
    explanationEn: 'The tether persists but its owner is interrupted.',
  },
  {
    effect: 'impact',
    counter: 'ken',
    outcome: 'reduced',
    explanationFr: "Ken répartit l'impact sur toute l'aura.",
    explanationEn: 'Ken spreads the impact across the aura.',
  },
  {
    effect: 'impact',
    counter: 'evade',
    outcome: 'countered',
    explanationFr: "L'engagement manque sa trajectoire annoncée.",
    explanationEn: 'The committed trajectory misses.',
  },
  {
    effect: 'barrage',
    counter: 'evade',
    outcome: 'reduced',
    explanationFr: 'Une esquive latérale retire une partie de la rafale.',
    explanationEn: 'A lateral evade sheds part of the barrage.',
  },
  {
    effect: 'barrage',
    counter: 'ken',
    outcome: 'reduced',
    explanationFr: 'Ken absorbe les impacts dispersés.',
    explanationEn: 'Ken absorbs the distributed impacts.',
  },
  {
    effect: 'enhance',
    counter: 'gyo',
    outcome: 'exposed',
    explanationFr: "Gyo révèle la concentration d'aura.",
    explanationEn: 'Gyo reveals the aura concentration.',
  },
]

export function resolveHatsuInteraction(
  effect: ArenaHatsuEffect,
  counter: HatsuCounter,
): HatsuInteraction | null {
  return INTERACTIONS.find((entry) => entry.effect === effect && entry.counter === counter) ?? null
}
