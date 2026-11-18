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
      'L : transforme les menottes en pigeon. ↓+L : rappel, ouverture au contact. Garde, saut ou frappe évitent la capture ; elle cesse sur blessure ou après 0,8 s. U : couteaux réels en nombre limité. Le panneau propose arme-serpent, chat-caméra mobile, enregistrement, émetteur-huître, récepteur à transmettre et retour de hache au contact. Quantités et durées de combat : réglages du duel.',
    mechanicEn:
      'L: turn handcuffs into a pigeon. ↓+L: recall, unlock at contact. Guard, jump or strike to avoid capture; injury or 0.8 s ends it. U: finite real knives. The panel offers snake guns, a moving cat camera, recordings, an oyster transmitter, receiver handover and a close axe counter. Combat quantities and timings are duel tuning.',
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
