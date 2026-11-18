import { PREPARED_COSTS } from './preparationTuning'
import type { FighterMove, FighterMoveset } from './movesetTypes'

const DETAILS = {
  sayird: [
    'Little Eye',
    'Little Eye',
    'Little Eye contrôle un petit animal réel, au plus de la taille d’un hamster : Sayird voit et entend par lui. Les créatures matérialisées par le Nen sont exclues.',
    'Little Eye controls a real small animal, up to hamster size: Sayird sees and hears through it. Nen-conjured creatures are excluded.',
  ],
  cluck: [
    'Courrier par pigeon',
    'Pigeon courier',
    'Envoyer un pigeon réel au point de livraison ; aucune attaque d’oiseaux inventée. Les conditions complètes du Hatsu restent inconnues.',
    'Send a real pigeon to the delivery point; no invented bird attack. The Hatsu’s full conditions remain unknown.',
  ],
  luini: [
    'Téléportation spatiale',
    'Spatial teleportation',
    'L : ancrer depuis l’intérieur de la pièce fermée à porte unique, puis partir vers un lieu déjà visité. Depuis l’extérieur, L revient de n’importe où. Ouvrir la porte condamne définitivement la pièce.',
    'L: anchor from inside a sealed single-door room, then leave for an already visited place. Outside, L returns from anywhere. Opening the door permanently burns the room.',
  ],
} as const

const LUINI_NORMALS: Record<string, string> = {
  standingLight: 'Pointe du couteau|Knife thrust',
  standingHeavy: 'Entaille au couteau|Knife slash',
  lowLight: 'Coup bas|Low kick',
  lowHeavy: 'Balayage|Sweep',
  airLight: 'Entaille aérienne|Air slash',
  airHeavy: 'Talon descendant|Descending heel',
  forwardLight: 'Pointe en avançant|Advancing thrust',
  forwardHeavy: 'Entaille en avançant|Advancing slash',
  backHeavy: 'Revers|Backfist',
  throw: 'Projection|Throw',
}

/** Replace the old offensive carrier with the utility that the simulation actually performs. */
export function tunePreparationMoveset(base: FighterMoveset): FighterMoveset {
  const id = base.fighterId as keyof typeof DETAILS
  const details = DETAILS[id]
  if (!details) return base
  const travel = id === 'luini'
  const moves = base.moves
    .filter((move) => !travel || move.kind !== 'special' || move.slot === 'neutralSpecial')
    .map((move) => (move.slot === 'neutralSpecial' ? utilityMove(move, details) : move))
  const physical = new Set(
    moves.filter((move) => move.slot !== 'neutralSpecial').map((move) => move.id),
  )
  return {
    ...base,
    mechanicFr: `${details[2]} L utilise la ressource présente ; le vol et la copie conservent les prérequis.`,
    mechanicEn: `${details[3]} L uses the available resource; theft and copying preserve requirements.`,
    finisherConditionFr: travel ? '' : base.finisherConditionFr,
    finisherConditionEn: travel ? '' : base.finisherConditionEn,
    moves: moves.map((move) => ({
      ...move,
      ...luiniPhysicalLabel(id, move),
      cancelInto: move.cancelInto.filter((target) => physical.has(target)),
    })),
    combos: base.combos
      .map((combo) => combo.filter((target) => physical.has(target)))
      .filter((combo) => combo.length >= 2),
  }
}
function luiniPhysicalLabel(id: string, move: FighterMove) {
  const label = id === 'luini' ? LUINI_NORMALS[move.slot] : undefined
  if (!label) return {}
  const [nameFr, nameEn] = label.split('|')
  return { nameFr, nameEn }
}

function utilityMove(move: FighterMove, details: readonly string[]): FighterMove {
  return {
    ...move,
    nameFr: details[0],
    nameEn: details[1],
    auraCost: PREPARED_COSTS[move.id.split(':')[0] as keyof typeof PREPARED_COSTS] ?? 0,
    input: 'L',
    cancelInto: [],
    tuning: {
      ...move.tuning,
      damage: 0,
      reach: 0,
      lunge: 0,
      hitstun: 0,
      blockstun: 0,
      hitstop: 0,
      knockback: 0,
    },
    canon: {
      ...move.canon,
      narrativeEffect: details[3],
      conditions: [details[3]],
      prohibitions: [
        'No damaging carrier, automatic evasion or transfer of physical prerequisites with a copied Hatsu.',
      ],
    },
  }
}
