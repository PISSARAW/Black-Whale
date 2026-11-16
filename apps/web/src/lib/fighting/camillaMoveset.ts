import type { FighterMoveset } from './movesetTypes'

/** Cat's Name has no manual attack, charged finisher, or HP threshold. */
export function tuneCamillaMoveset(moveset: FighterMoveset): FighterMoveset {
  if (moveset.fighterId !== 'camilla') return moveset
  const moves = moveset.moves.filter((move) => move.kind !== 'special')
  const ids = new Set(moves.map((move) => move.id))
  return {
    ...moveset,
    mechanicFr:
      'U : pistolet réel, utilisable sans aura. Cat’s Name est automatique après une mort attribuée à un adversaire vivant : capture, absorption, résurrection. Points, temps et TKO ne le déclenchent pas. Les coups physiques ordinaires sont adaptés au duel.',
    mechanicEn:
      'U: real pistol, usable without aura. Cat’s Name automatically answers a death attributed to a living opponent: capture, absorption, revival. Points, time and TKO never trigger it. Ordinary physical blows are duel adaptations.',
    finisherConditionFr: 'Automatique après la mort ; aucun seuil de PV ou bouton Hatsu.',
    finisherConditionEn: 'Automatic after death; no HP threshold or Hatsu button.',
    moves: moves.map((move) => ({
      ...move,
      cancelInto: move.cancelInto.filter((id) => ids.has(id)),
    })),
    combos: moveset.combos
      .map((route) => route.filter((id) => ids.has(id)))
      .filter((route) => route.length > 1),
  }
}
