import { BIOHAZARD_COST, biohazardBodyFree, biohazardCanLaunch, biohazardNen } from './biohazard'
import type { FighterMoveset } from './movesetTypes'
import type { ArcadeFighter } from './types'

/** The duel supports the attested handcuff transformation; no invented menagerie super. */
export function tuneBiohazardMoveset(moveset: FighterMoveset): FighterMoveset {
  if (moveset.fighterId !== 'hinrigh') return moveset
  const retained = moveset.moves.filter(
    (move) => move.kind !== 'special' || ['neutralSpecial', 'downSpecial'].includes(move.slot),
  )
  const ids = new Set(retained.map((move) => move.id))
  return {
    ...moveset,
    mechanicFr:
      'L : transforme une paire de menottes portée en pigeon. ↓+L : rappel des pigeons libres, ouverture au contact. Deux objets réels, récupérables au sol. Garde, saut ou frappe évitent la capture ; elle cesse sur blessure ou après 0,8 s. U : couteau réel (adaptation de duel).',
    mechanicEn:
      'L: turn carried handcuffs into a pigeon. ↓+L: recall free pigeons, unlock at contact. Two real objects, recoverable on the ground. Guard, jump or strike to avoid capture; injury or 0.8 s ends it. U: real thrown knife (duel adaptation).',
    finisherConditionFr: 'Aucun finisher : Biohazard transforme des objets, sans bonus personnel.',
    finisherConditionEn: 'No super: Biohazard transforms objects, without a personal buff.',
    moves: retained.map((move) => {
      const recall = move.slot === 'downSpecial'
      const names = recall
        ? ['Biohazard · Rappel', 'Biohazard · Recall']
        : ['Pigeon-menottes', 'Handcuff pigeon']
      const filtered = { ...move, cancelInto: move.cancelInto.filter((id) => ids.has(id)) }
      if (move.kind !== 'special') return filtered
      return {
        ...filtered,
        nameFr: names[0],
        nameEn: names[1],
        auraCost: recall ? 0 : BIOHAZARD_COST,
        tuning: { ...move.tuning, damage: 0, knockback: 0, lunge: 0, hitstun: 0, reach: 0 },
      }
    }),
    combos: moveset.combos
      .map((route) => route.filter((id) => ids.has(id)))
      .filter((route) => route.length > 1),
  }
}

export function biohazardMoveResources(fighter: ArcadeFighter, moveId: string): boolean | null {
  if (!moveId.startsWith('hinrigh:') || !moveId.endsWith('Special')) return null
  if (moveId === 'hinrigh:neutralSpecial') return biohazardCanLaunch(fighter)
  return (
    moveId === 'hinrigh:downSpecial' &&
    biohazardBodyFree(fighter) &&
    biohazardNen(fighter) &&
    Boolean(
      fighter.biohazard?.objects.some(
        (o) => o.phase === 'flying' || (o.phase === 'bound' && Math.abs(o.x - fighter.x) <= 4),
      ),
    )
  )
}
