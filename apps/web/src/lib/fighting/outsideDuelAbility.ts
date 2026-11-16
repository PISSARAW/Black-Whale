/** Canon Hatsu with no valid target in the duel; never substitute a martial strike. */
export interface OutsideDuelAbility {
  id: string
  nameFr: string
  nameEn: string
}

/** Ch. 361: a real small animal is controlled, with sight and hearing relayed. */
export const LITTLE_EYE: OutsideDuelAbility = {
  id: 'sayird:littleEye',
  nameFr: 'Little Eye',
  nameEn: 'Little Eye',
}

/** Ch. 388: growth support, with no suitable support target in the current duel. */
export const ERIGERON: OutsideDuelAbility = {
  id: 'bill:neutralSpecial',
  nameFr: 'Erigeron · Soutien',
  nameEn: 'Erigeron · Support',
}

export function outsideDuelAbility(moveId?: string): OutsideDuelAbility | null {
  if (moveId === ERIGERON.id) return ERIGERON
  return moveId === LITTLE_EYE.id ? LITTLE_EYE : null
}
