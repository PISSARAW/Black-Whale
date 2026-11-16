import { BEYOND_CURSE } from './beyondCurse'

/** Canon Hatsu with no valid target in the duel; never substitute a martial strike. */
export interface OutsideDuelAbility {
  id: string
  nameFr: string
  nameEn: string
  reasonFr: string
  reasonEn: string
}

/** Ch. 361: a real small animal is controlled, with sight and hearing relayed. */
export const LITTLE_EYE: OutsideDuelAbility = {
  id: 'sayird:littleEye',
  nameFr: 'Little Eye',
  nameEn: 'Little Eye',
  reasonFr: 'Aucun petit animal réel à contrôler dans ce duel.',
  reasonEn: 'No real small animal to control in this duel.',
}

/** Ch. 320: controlled birds deliver ballots; the full conditions remain unknown. */
export const BIRD_MANIPULATION: OutsideDuelAbility = {
  id: 'cluck:birdManipulation',
  nameFr: 'Contrôle d’oiseaux',
  nameEn: 'Bird Control',
  reasonFr: 'Aucun oiseau à contrôler dans ce duel. Conditions complètes inconnues.',
  reasonEn: 'No birds to control in this duel. Full conditions unknown.',
}

/** Ch. 388: growth support, with no suitable support target in the current duel. */
export const ERIGERON: OutsideDuelAbility = {
  id: 'bill:neutralSpecial',
  nameFr: 'Erigeron · Soutien',
  nameEn: 'Erigeron · Support',
  reasonFr: 'Aucune cible de soutien dans ce duel.',
  reasonEn: 'No support target in this duel.',
}

export function outsideDuelAbility(moveId?: string): OutsideDuelAbility | null {
  return [LITTLE_EYE, ERIGERON, BIRD_MANIPULATION, BEYOND_CURSE].find((ability) => ability.id === moveId) ?? null
}
