import { luiniAction, luiniAnchor, luiniRoomBurned } from './luiniSpatial'
import type { FightSide, FightState } from './types'

const COPY = {
  fr: {
    anchor: ['Ancrer la pièce', 'L · depuis l’intérieur de la pièce fermée ; aucun déplacement'],
    depart: [
      'Partir vers le lieu visité',
      'L · partir de la pièce vers un lieu déjà visité par cet utilisateur',
    ],
    return: ['Revenir à la pièce', 'L · retour depuis n’importe où tant que la porte reste fermée'],
    active: 'Pièce ancrée · ouvrir sa porte la rend définitivement inutilisable',
    inactive: 'Aucun ancrage actif',
    burned: 'Pièce définitivement inutilisable · porte ouverte',
  },
  en: {
    anchor: ['Anchor the room', 'L · from inside the sealed room; no movement'],
    depart: [
      'Leave for the visited place',
      'L · leave the room for a place this user has already visited',
    ],
    return: ['Return to the room', 'L · return from anywhere while the door stays closed'],
    active: 'Room anchored · opening its door makes it permanently unusable',
    inactive: 'No active anchor',
    burned: 'Room permanently unusable · door opened',
  },
} as const

export function luiniPhasePresentation(state: FightState, side: FightSide, language: 'fr' | 'en') {
  const copy = COPY[language]
  const [label, hint] = copy[luiniAction(state, side)]
  const status = luiniAnchor(state, side)
    ? copy.active
    : luiniRoomBurned(state, side)
      ? copy.burned
      : copy.inactive
  return { label, hint, status }
}
