import { franklinActiveFrames, franklinSalvo } from './franklinAttack'
import type { FighterMove, FighterMoveset } from './movesetTypes'

export function tuneFranklinMoveset(moveset: FighterMoveset): FighterMoveset {
  if (moveset.fighterId !== 'franklin') return moveset
  return {
    ...moveset,
    mechanicFr:
      'Double Machine Gun : les dix doigts sectionnés émettent des rafales de balles de Nen depuis les deux mains. Franklin reste exposé pendant le tir ; un coup reçu interrompt les tirs suivants.',
    mechanicEn:
      'Double Machine Gun: ten severed fingertips emit volleys of Nen bullets from both hands. Franklin remains exposed while firing; getting hit interrupts subsequent shots.',
    finisherConditionFr:
      '55 points d’aura et une longue ouverture pour la rafale prolongée. Aucun seuil de PV adverse.',
    finisherConditionEn:
      '55 aura and a long opening for the extended barrage. No opponent HP threshold.',
    moves: moveset.moves.map(tuneGunMove),
  }
}

function tuneGunMove(move: FighterMove): FighterMove {
  if (move.category !== 'special' && move.category !== 'finisher') return move
  const salvo = franklinSalvo({ attack: { kind: 'special', moveId: move.id } })
  const primary = move.slot === 'neutralSpecial'
  const label = primary ? 'Double Machine Gun' : `${move.nameFr} · Double Machine Gun`
  return {
    ...move,
    nameFr: move.slot === 'finisher' ? 'Double Machine Gun · Rafale prolongée' : label,
    nameEn: move.slot === 'finisher' ? 'Double Machine Gun · Extended Barrage' : move.nameEn,
    tuning: {
      ...move.tuning,
      startup: salvo.startup,
      active: franklinActiveFrames(salvo.shots),
      recovery: salvo.recovery,
      lunge: 0,
      damage: 0,
      reach: 34,
      auraZone: 'hands',
      targetZone: move.slot === 'downSpecial' ? 'feet' : 'torso',
    },
    canon: {
      source: 'Hunter × Hunter — Yorknew City, chapters 73 and 76',
      evidence: primary ? 'manga-shown' : 'gameplay-abstraction',
      conditions: [
        'Nen must be available; aura bullets leave the ends of both hands’ ten fingers.',
      ],
      prohibitions: [
        'No invisible direct hit, automatic execution or universal bypass of Nen defence.',
        'The aiming variants and prolonged volley are uses of the same Hatsu, not new abilities.',
      ],
      narrativeCost:
        'Permanently severed fingertips: a voluntary restriction that strengthens the bullets. Aura expenditure and vulnerable firing time are duel tuning.',
      narrativeEffect:
        'High-rate emitted aura bullets. Damage occurs only when a travelling bullet reaches the target.',
    },
  }
}
