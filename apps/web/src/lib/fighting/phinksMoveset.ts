import type { FighterMoveset, MoveTuning } from './movesetTypes'
import type { TechniqueCanonContract } from './techniqueContracts'

const CYCLOTRON_CANON: TechniqueCanonContract = {
  source: 'Hunter × Hunter, chapter 226 — right-arm rotations and Ripper Cyclotron',
  evidence: 'gameplay-abstraction',
  conditions: [
    'Each completed clockwise rotation of the right arm adds power to its charged punch.',
  ],
  prohibitions: ['No global damage bonus, seven-turn cap, or canonical four-turn minimum.'],
  narrativeCost: 'Visible, vulnerable wind-up. 36 frames and 2 aura per full turn are duel tuning.',
  narrativeEffect:
    'L starts/pauses winding; H spends completed turns in one right punch. Misses, guards and interrupted punches spend the charge in this duel.',
}

const WINDUP: Partial<MoveTuning> = {
  startup: 0,
  active: 1,
  recovery: 0,
  damage: 0,
  lunge: 0,
  reach: 0,
  hitstun: 0,
  blockstun: 0,
  knockback: 0,
}
const PUNCH: Partial<MoveTuning> = {
  startup: 14,
  active: 5,
  recovery: 24,
  damage: 18,
  lunge: 0,
  reach: 12,
  hitstun: 25,
  blockstun: 14,
  knockback: 5,
}

export function tunePhinksMoveset(moveset: FighterMoveset): FighterMoveset {
  if (moveset.fighterId !== 'phinks') return moveset
  return {
    ...moveset,
    mechanicFr:
      'L : lancer / arrêter les rotations du bras droit. Seuls les tours complets chargent le poing. H : libérer la charge ; aucun bonus aux autres attaques.',
    mechanicEn:
      'L: start / pause right-arm rotations. Only full turns charge the fist. H: release the charge; other attacks gain no bonus.',
    finisherConditionFr:
      'Au moins un tour complet, Nen actif et liberté d’agir. Toute la charge est engagée dans le poing droit, même si le coup manque.',
    finisherConditionEn:
      'At least one full turn, active Nen and freedom to act. All charge is committed to the right punch, even on a miss.',
    moves: moveset.moves
      .filter((move) => !['forwardSpecial', 'downSpecial', 'backSpecial'].includes(move.slot))
      .map((move) => {
        if (!['special', 'finisher'].includes(move.category)) return move
        const release = move.slot === 'finisher'
        return {
          ...move,
          auraCost: 0,
          canon: CYCLOTRON_CANON,
          cancelInto: [],
          nameFr: release ? 'Libérer Ripper Cyclotron' : 'Mouliner le bras droit',
          nameEn: release ? 'Release Ripper Cyclotron' : 'Wind the Right Arm',
          tuning: {
            ...move.tuning,
            ...(release ? PUNCH : WINDUP),
          },
        }
      })
      .map((move) => ({
        ...move,
        cancelInto: move.cancelInto.filter((id) => !/Special$|:finisher$/.test(id)),
      })),
    combos: moveset.combos.filter((route) =>
      route.every((id) => !/:(forward|down|back)Special$/.test(id)),
    ),
  }
}
