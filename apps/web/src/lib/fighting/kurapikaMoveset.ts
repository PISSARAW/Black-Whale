import type { FighterMove, FighterMoveset, MoveTuning } from './movesetTypes'
import type { MoveSlot } from './types'

const CHAIN_CAST: Partial<MoveTuning> = {
  damage: 0,
  knockback: 0,
  lunge: 0,
  bottom: 3,
  top: 11,
  targetZone: 'torso',
  auraZone: 'hands',
}
type ChainTuning = Partial<Omit<FighterMove, 'tuning'>> & { tuning: Partial<MoveTuning> }
const CHAIN_MOVES: Partial<Record<MoveSlot, ChainTuning>> = {
  neutralSpecial: { variant: 'standing', guard: 'mid', tuning: CHAIN_CAST },
  backSpecial: { variant: 'standing', guard: 'mid', tuning: CHAIN_CAST },
  downSpecial: {
    variant: 'standing',
    guard: 'mid',
    auraCost: 20,
    tuning: { ...CHAIN_CAST, startup: 30, active: 1, hitstun: 0, blockstun: 0 },
  },
  finisher: {
    variant: 'standing',
    guard: 'mid',
    auraCost: 35,
    nameFr: 'Judgment Chain · Reste en Zetsu',
    nameEn: 'Judgment Chain · Remain in Zetsu',
    tuning: { ...CHAIN_CAST, hitstun: 0, blockstun: 0, reach: 7 },
  },
}

/** Damage, healing amounts and cast timings are duel tuning, not manga measurements. */
export function tuneKurapikaMoveset(moveset: FighterMoveset): FighterMoveset {
  if (moveset.fighterId !== 'kurapika') return moveset
  return {
    ...moveset,
    mechanicFr:
      'Aura + H : Emperor Time (1 seconde = 1 heure de vie). L : Chain Jail, Brigade seulement, sinon mort ; L libère. ↓ + L : soin. ← + L : drainage, puis chargement et usage unique via Stealth Dolphin. H : Judgment Chain, règle « reste en Zetsu ».',
    mechanicEn:
      'Aura + H: Emperor Time (1 second = 1 hour of life). L: Chain Jail, Troupe only or death; L releases. ↓ + L: heal. ← + L: drain, then load and use once through Stealth Dolphin. H: Judgment Chain, rule “remain in Zetsu”.',
    finisherConditionFr:
      'Emperor Time actif et contact au cœur ; aucun seuil de PV. La cible peut combattre sans Nen ; utiliser l’aura brise la règle et la tue.',
    finisherConditionEn:
      'Active Emperor Time and contact with the heart; no HP threshold. The target may fight without Nen; using aura breaks the rule and kills them.',
    moves: moveset.moves.map(tuneChain),
  }
}

function tuneChain(move: FighterMove): FighterMove {
  const chain = CHAIN_MOVES[move.slot]
  return chain ? { ...move, ...chain, tuning: { ...move.tuning, ...chain.tuning } } : move
}
