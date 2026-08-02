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
  interaction(
    'bind',
    'distance',
    'countered',
    "L'ancrage est hors de portée.",
    'The anchor is out of range.',
  ),
  interaction(
    'bind',
    'interrupt',
    'exposed',
    'Le lien persiste mais son porteur est interrompu.',
    'The tether persists but its owner is interrupted.',
  ),
  interaction(
    'impact',
    'ken',
    'reduced',
    "Ken répartit l'impact sur toute l'aura.",
    'Ken spreads the impact across the aura.',
  ),
  interaction(
    'impact',
    'evade',
    'countered',
    "L'engagement manque sa trajectoire annoncée.",
    'The committed trajectory misses.',
  ),
  interaction(
    'barrage',
    'evade',
    'reduced',
    'Une esquive latérale retire une partie de la rafale.',
    'A lateral evade sheds part of the barrage.',
  ),
  interaction(
    'barrage',
    'ken',
    'reduced',
    'Ken absorbe les impacts dispersés.',
    'Ken absorbs the distributed impacts.',
  ),
  interaction(
    'enhance',
    'gyo',
    'exposed',
    "Gyo révèle la concentration d'aura.",
    'Gyo reveals the aura concentration.',
  ),
]

export function resolveHatsuInteraction(
  effect: ArenaHatsuEffect,
  counter: HatsuCounter,
): HatsuInteraction | null {
  return INTERACTIONS.find((entry) => entry.effect === effect && entry.counter === counter) ?? null
}

function interaction(
  effect: ArenaHatsuEffect,
  counter: HatsuCounter,
  outcome: HatsuInteraction['outcome'],
  explanationFr: string,
  explanationEn: string,
): HatsuInteraction {
  return { effect, counter, outcome, explanationFr, explanationEn }
}
