import type { OutsideDuelAbility } from './outsideDuelAbility'

/** Descriptive name: the sacrificial curse is real; its official name is unknown. */
export const BEYOND_CURSE: OutsideDuelAbility = {
  id: 'beyond:sacrificialCurse',
  nameFr: 'Malédiction sacrificielle · Beyond',
  nameEn: 'Sacrificial Curse · Beyond',
  reasonFr:
    'Hatsu réel, indisponible ici : exige un porteur marqué à l’avance, une cible désignée et la mort du porteur. Cette préparation n’est pas représentée dans le duel. Le nom de la capacité reste inconnu.',
  reasonEn:
    'A real Hatsu, unavailable here: requires a previously marked vessel, a designated target and the vessel’s death. This preparation is not represented in the duel. The ability’s name remains unknown.',
}

export const BEYOND_DUEL_MECHANIC = {
  fr: 'Beyond conserve ses coups physiques et ses frappes renforcées au Ren : L est une charge physique. Sa malédiction est un Hatsu réel, mais exige un porteur marqué, une cible désignée et la mort du porteur. Préparation indisponible dans ce duel ; aucun finisher à faible santé.',
  en: 'Beyond keeps his physical blows and Ren-powered strikes: L is a physical charge. His curse is a real Hatsu, but requires a marked vessel, a designated target and the vessel’s death. This preparation is unavailable in this duel; no low-health super.',
} as const
