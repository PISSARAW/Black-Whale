import { MELODY_START_COST, MELODY_STARTUP, MELODY_MUSIC_MOVE } from './melodyTuning'
import type { FighterMoveset } from './movesetTypes'

const NAMES: Record<string, readonly [string, string]> = {
  standingLight: ['Direct', 'Straight'],
  standingHeavy: ['Coup de paume', 'Palm Strike'],
  lowLight: ['Coup bas', 'Low Strike'],
  lowHeavy: ['Balayage', 'Sweep'],
  airLight: ['Direct aérien', 'Air Straight'],
  airHeavy: ['Coup descendant', 'Descending Strike'],
  forwardLight: ['Direct en avançant', 'Advancing Straight'],
  forwardHeavy: ['Coup d’épaule', 'Shoulder Strike'],
  backHeavy: ['Revers', 'Backfist'],
  throw: ['Projection', 'Throw'],
}

/** One attested musical Hatsu; mundane combat remains an arcade abstraction. */
export function tuneMelodyMoveset(base: FighterMoveset): FighterMoveset {
  if (base.fighterId !== 'melody') return base
  const physical = base.moves.filter((move) => !['special', 'finisher'].includes(move.category))
  const physicalIds = new Set(physical.map((move) => move.id))
  const music = base.moves.find((move) => move.id === MELODY_MUSIC_MOVE)!
  return {
    ...base,
    mechanicFr:
      'L (avec ou sans direction) : jouer / arrêter la flûte. Préparation au sol, puis 6 aura/s : les auditeurs proches sont apaisés sans dégâts. Déplacement, garde, coup reçu, perte de flûte ou de Nen interrompent la musique. E maintenu (P2 : C) : se couvrir les oreilles, sans garde ni attaque. L’ouïe lit le rythme cardiaque, même en Zetsu ; après écoute, la parade manuelle gagne 3 frames (adaptation au duel).',
    mechanicEn:
      'L (with any direction): play / stop the flute. Grounded preparation, then 6 aura/s: nearby listeners are pacified without damage. Moving, guarding, incoming contact, losing the flute or Nen interrupts music. Hold E (P2: C): cover ears, without guarding or attacking. Hearing reads heart rhythms even in Zetsu; after listening, manual parries gain 3 frames (duel adaptation).',
    finisherConditionFr: '',
    finisherConditionEn: '',
    moves: [
      ...physical.map((move) => ({
        ...move,
        nameFr: NAMES[move.slot][0],
        nameEn: NAMES[move.slot][1],
        cancelInto: move.cancelInto.filter((id) => physicalIds.has(id)),
      })),
      {
        ...music,
        input: 'L · jouer / arrêter',
        nameFr: 'Musique envoûtante',
        nameEn: 'Enchanting Music',
        auraCost: MELODY_START_COST,
        cancelInto: [],
        canon: {
          source: 'Yorknew / Succession Contest — Melody’s flute',
          evidence: 'manga-shown',
          conditions: [
            'A real flute, usable Nen and listeners who can hear the ongoing performance.',
          ],
          prohibitions: [
            'Music causes no wounds, hit score, shield or automatic dodge. Hearing is a bodily faculty, not a copied Hatsu.',
          ],
          narrativeCost:
            'Continuous performance and aura. Stationary casting, radius and timing are duel adaptations.',
          narrativeEffect:
            'Soothes the listeners and absorbs their attention while the music remains audible.',
        },
        tuning: {
          ...music.tuning,
          startup: MELODY_STARTUP,
          active: 1,
          recovery: 0,
          damage: 0,
          hitstun: 0,
          blockstun: 0,
          hitstop: 0,
          knockback: 0,
          reach: 0,
          lunge: 0,
        },
      },
    ],
    combos: base.combos.map((route) => route.filter((id) => physicalIds.has(id))),
  }
}
