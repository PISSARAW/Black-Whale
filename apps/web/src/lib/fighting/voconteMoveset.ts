import type { FighterMoveset } from './movesetTypes'
import type { TechniqueCanonContract } from './techniqueContracts'

const DOOR_CANON: TechniqueCanonContract = {
  source: 'Hunter × Hunter, chapters 393–394 and 398–399 — Door, directional human passage',
  evidence: 'gameplay-abstraction',
  conditions: ['A person actually crosses a prepared doorframe in its triggering direction.'],
  prohibitions: [
    'No automatic dodge, damaging portal strike, or teleport of thrown weapons and Nen constructs.',
    'Luini’s sealed-room and visited-destination conditions do not belong to Door.',
  ],
  narrativeCost:
    'This duel supplies two physical frames. Their placement, 20-aura setup, 18-frame startup and Nen maintenance are duel tuning.',
  narrativeEffect:
    'L connects or closes the two frames without moving anyone. Walking through an active threshold transports either fighter. Exact creation limits remain unknown.',
}

export function tuneVoconteMoveset(moveset: FighterMoveset): FighterMoveset {
  if (moveset.fighterId !== 'voconte') return moveset
  return {
    ...moveset,
    mechanicFr:
      'L : relier / refermer les deux huisseries. A vers la droite → B ; B vers la gauche → A. Tout combattant réel qui franchit le seuil est transporté.',
    mechanicEn:
      'L: connect / close the two physical frames. A rightwards → B; B leftwards → A. Either real fighter crossing the threshold is transported.',
    finisherConditionFr: 'Aucun finisher offensif attesté pour Door.',
    finisherConditionEn: 'Door has no attested offensive finisher.',
    moves: moveset.moves
      .filter(
        (move) => !['forwardSpecial', 'downSpecial', 'backSpecial', 'finisher'].includes(move.slot),
      )
      .map((move) =>
        move.slot !== 'neutralSpecial'
          ? move
          : {
              ...move,
              nameFr: 'Door · Relier les seuils',
              nameEn: 'Door · Connect Frames',
              auraCost: 20,
              canon: DOOR_CANON,
              cancelInto: [],
              tuning: {
                ...move.tuning,
                startup: 18,
                active: 1,
                recovery: 12,
                damage: 0,
                reach: 0,
                lunge: 0,
                hitstun: 0,
                blockstun: 0,
                knockback: 0,
                hitstop: 0,
              },
            },
      )
      .map((move) => ({
        ...move,
        cancelInto: move.cancelInto.filter((id) => !/Special$|:finisher$/.test(id)),
      })),
    combos: [
      ['standingLight', 'standingHeavy'],
      ['lowLight', 'forwardHeavy'],
      ['airLight', 'airHeavy'],
    ].map((route) => route.map((slot) => `voconte:${slot}`)),
  }
}
