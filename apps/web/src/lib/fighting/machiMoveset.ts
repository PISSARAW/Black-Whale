import type { FighterMove, FighterMoveset } from './movesetTypes'

const UTILITY = { damage: 0, hitstun: 0, blockstun: 0, hitstop: 0, knockback: 0, lunge: 0 }

export function tuneMachiMoveset(moveset: FighterMoveset): FighterMoveset {
  if (moveset.fighterId !== 'machi') return moveset
  return {
    ...moveset,
    mechanicFr:
      'L : suture personnelle préparée, interrompue par un coup. → + L / U : aiguille de pistage, sans immobilisation. ↓ + L : ligature au contact, maintenue par un fil court. ← + L : lâcher le fil. Un fil trop long ou lâché conserve seulement le pistage ; aucun stun automatique.',
    mechanicEn:
      'L: prepared self-suture, interrupted by a hit. → + L / U: tracking needle, no restraint. ↓ + L: contact bind maintained by a short thread. ← + L: release the thread. A long or released grip only tracks; no automatic stun.',
    finisherConditionFr: 'Un véritable fil de ligature court doit encore relier Machi à la cible.',
    finisherConditionEn:
      'A maintained short binding thread must still connect Machi to the target.',
    moves: moveset.moves.map(tuneMove),
  }
}

function tuneMove(move: FighterMove): FighterMove {
  if (move.slot === 'neutralSpecial')
    return {
      ...move,
      auraCost: 20,
      nameFr: 'Nen Stitches · Suture',
      nameEn: 'Nen Stitches · Suture',
      tuning: { ...move.tuning, ...UTILITY, startup: 30, active: 1 },
    }
  if (move.slot === 'forwardSpecial')
    return {
      ...move,
      auraCost: 18,
      nameFr: 'Aiguille de pistage',
      nameEn: 'Tracking Needle',
      tuning: { ...move.tuning, ...UTILITY, reach: 13, bottom: 0, top: 12 },
    }
  if (move.slot === 'downSpecial')
    return {
      ...move,
      auraCost: 24,
      variant: 'standing',
      nameFr: 'Ligature · Fil maintenu',
      nameEn: 'Bind · Held Thread',
      tuning: { ...move.tuning, ...UTILITY, reach: 9, bottom: 0, top: 12 },
    }
  if (move.slot === 'backSpecial')
    return {
      ...move,
      auraCost: 0,
      nameFr: 'Lâcher le fil',
      nameEn: 'Release Thread',
      tuning: { ...move.tuning, ...UTILITY },
    }
  if (move.slot === 'finisher')
    return { ...move, nameFr: 'Fil tendu · Tension finale', nameEn: 'Taut Thread · Final Tension' }
  return move
}
