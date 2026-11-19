import { illumiCanon } from './illumiCanon'
import { ILLUMI_DISGUISE_COST, ILLUMI_IMPLANT_COST } from './illumiState'
import type { FighterMove, FighterMoveset } from './movesetTypes'

const UTILITY = { damage: 0, hitstun: 0, blockstun: 0, hitstop: 0, knockback: 0, lunge: 0 }

export function tuneIllumiMoveset(moveset: FighterMoveset): FighterMoveset {
  if (moveset.fighterId !== 'illumi') return moveset
  const moves = moveset.moves.filter((move) => move.slot !== 'finisher').map(tuneMove)
  const ids = new Set(moves.map((move) => move.id))
  return {
    ...moveset,
    moves,
    mechanicFr:
      'L : implanter une aiguille spéciale au crâne avec la consigne « Reste ». → + L : approche ; ↓ + L : éloigne-toi. Sans aiguille implantée, ces commandes préparent la prochaine consigne. La victime perd son autonomie jusqu’à la fin de la manche ; aucun drainage d’aura ni retour après deux secondes. ← + L prépare le visage choisi dans le panneau : Gittarackur avec aiguilles ou visage d’Hisoka sans aiguilles. Répéter revient au visage d’origine, sans bonus défensif.',
    mechanicEn:
      'L: implant a special skull needle with the Stay order. → + L: approach; ↓ + L: retreat. Without an implanted needle, these select its next order. The victim loses autonomy for the round, without aura drain or a two-second release. ← + L prepares the face selected in the panel: Gittarackur with needles or Hisoka’s face without needles. Repeat to revert, without defence bonuses.',
    finisherConditionFr:
      'Aucun finisher offensif attesté. L sur une marionnette ordonne de rester.',
    finisherConditionEn: 'No attested offensive finisher. L orders an existing puppet to stay.',
    combos: moveset.combos.filter(
      (route) => route.every((id) => ids.has(id)) && route.every((id) => !id.includes('Special')),
    ),
  }
}

function tuneMove(move: FighterMove): FighterMove {
  if (move.kind !== 'special')
    return { ...move, cancelInto: move.cancelInto.filter((id) => !id.includes('Special')) }
  const labels: Record<string, [string, string]> = {
    neutralSpecial: [
      'Needle People · Implantation crânienne',
      'Needle People · Skull implantation',
    ],
    forwardSpecial: ['Ordre · Approche', 'Order · Approach'],
    downSpecial: ['Ordre · Éloigne-toi', 'Order · Retreat'],
    backSpecial: ['Visage · Remodelage physique', 'Face · Physical alteration'],
  }
  const implant = move.slot === 'neutralSpecial'
  const [nameFr, nameEn] = labels[move.slot]
  return {
    ...move,
    nameFr,
    nameEn,
    cancelInto: [],
    auraCost:
      { neutralSpecial: ILLUMI_IMPLANT_COST, backSpecial: ILLUMI_DISGUISE_COST }[
        move.slot as 'neutralSpecial' | 'backSpecial'
      ] ?? 0,
    variant: 'standing',
    guard: 'mid',
    tuning: {
      ...move.tuning,
      ...UTILITY,
      targetZone: 'head',
      startup: 14,
      active: 2,
      recovery: 18,
      ...(implant ? { reach: 8, bottom: 8, top: 12 } : { reach: 0, bottom: 0, top: 0 }),
    },
    canon: illumiCanon(move.slot),
  }
}
