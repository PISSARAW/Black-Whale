import type { FighterMoveset } from './movesetTypes'
import type { TechniqueCanonContract } from './techniqueContracts'

const FUTURE_CANON: TechniqueCanonContract = {
  source: 'Hunter × Hunter, ch. 385–387 — Zetsu, closed eyes and the ten-second prediction',
  evidence: 'gameplay-abstraction',
  conditions: [
    'Voluntary complete Zetsu with closed eyes.',
    'Opening the eyes lets the user diverge while the opponent perceives the prediction.',
  ],
  prohibitions: [
    'No automatic dodge, time rewind, damage buff or offensive Guardian Beast.',
    'The initial ten-second vision does not advance the real duel.',
  ],
  narrativeCost: 'Vulnerable Zetsu preparation; its 30-frame startup is duel tuning.',
  narrativeEffect:
    'The real engine forecasts 600 frames. In local play, held opponent controls are extrapolated and replayed; future human decisions cannot be known.',
}

export function tuneParallelFutureMoveset(moveset: FighterMoveset): FighterMoveset {
  if (moveset.fighterId !== 'tserriednich') return moveset
  const moves = moveset.moves
    .filter((move) => !['forwardSpecial', 'downSpecial', 'backSpecial'].includes(move.slot))
    .map((move) => {
      if (move.category !== 'special' && move.category !== 'finisher') return move
      return {
        ...move,
        auraCost: 0,
        nameFr:
          move.slot === 'finisher'
            ? 'Ouvrir les yeux · Diverger'
            : 'Laplace Devil · Zetsu, yeux fermés',
        nameEn:
          move.slot === 'finisher' ? 'Open Eyes · Diverge' : 'Laplace Devil · Zetsu, Eyes Closed',
        canon: FUTURE_CANON,
        tuning: { ...move.tuning, damage: 0, reach: 0, lunge: 0 },
      }
    })
    .map((move) => ({
      ...move,
      cancelInto: move.cancelInto.filter((id) => !id.includes('Special')),
    }))
  return {
    ...moveset,
    moves,
    mechanicFr:
      'L : entrer en Zetsu et fermer les yeux. Après préparation vulnérable, inspecter les dix prochaines secondes ; L ou H rouvre les yeux et permet de diverger. Aucune esquive automatique.',
    mechanicEn:
      'L: enter Zetsu and close the eyes. After vulnerable preparation, inspect the next ten seconds; L or H opens the eyes to diverge. No automatic dodge.',
    finisherConditionFr:
      'Une vision de dix secondes doit être ouverte. H rouvre les yeux sans infliger de dégâts.',
    finisherConditionEn:
      'A ten-second vision must be open. H opens the eyes without dealing damage.',
    combos: [
      ['standingLight', 'standingHeavy'],
      ['lowLight', 'forwardHeavy'],
      ['airLight', 'standingHeavy'],
    ].map((slots) => slots.map((slot) => `tserriednich:${slot}`)),
  }
}
