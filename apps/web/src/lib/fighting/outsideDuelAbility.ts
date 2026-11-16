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

export function outsideDuelAbility(moveId?: string): OutsideDuelAbility | null {
  return moveId === LITTLE_EYE.id ? LITTLE_EYE : null
}
