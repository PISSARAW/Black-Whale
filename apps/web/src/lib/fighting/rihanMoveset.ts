import { buildMoveset } from './movesetFactory'
import type { FighterMove, FighterMoveset } from './movesetTypes'

/** Analysis and targeted predation, never a damaging strike or an adaptive body buff. */
export function rihanMoveset(): FighterMoveset {
  const base = buildMoveset({
    fighterId: 'rihan',
    mechanic: [
      'Predator : L commence l’analyse d’un Hatsu matérialisé visible. →/← + L choisit une autre capacité observée ; ↓ + L abandonne. H (ou L après analyse) lâche un prédateur ciblé. Un succès détruit cette manifestation et prive Rihan de tout Nen pendant 48 heures simulées, y compris aux manches suivantes. Trois secondes d’observation cumulées sont un réglage du duel.',
      'Predator: L studies a visible Nen manifestation. →/← + L selects another observed ability; ↓ + L abandons the study. H (or L after analysis) releases a targeted predator. Success devours that manifestation and seals all of Rihan’s Nen for 48 simulated hours, across rounds. Three seconds of accumulated observation is a duel abstraction.',
    ],
    finisherCondition: [
      'Le Hatsu précis doit avoir été étudié, être encore manifesté et Rihan doit disposer de 40 aura.',
      'The specific Hatsu must be studied and still manifested, with 40 aura available.',
    ],
    labels: [
      'Direct|Straight',
      'Coude du garde|Guard Elbow',
      'Coup au corps|Body Blow',
      'Fauchage|Sweep',
      'Direct aérien|Air Straight',
      'Erreur enregistrée|Recorded Error',
      'Regard prédateur|Predator Gaze',
      'Pas sans hypothèse|Hypothesis-Free Step',
      'Analyse interrompue|Interrupted Analysis',
      'Predator · Analyser|Predator · Study',
      'Hatsu observé suivant|Next observed Hatsu',
      'Abandonner l’analyse|Abandon analysis',
      'Hatsu observé précédent|Previous observed Hatsu',
      'Predator|Predator',
      'Predator · Prédation ciblée|Predator · Targeted predation',
    ],
    speed: 0.96,
    power: 1.04,
    reach: 1.4,
    combos: [
      ['standingLight', 'backHeavy'],
      ['lowLight', 'standingHeavy'],
      ['airLight', 'airHeavy'],
    ],
  })
  return { ...base, moves: base.moves.map(tunePredatorMove) }
}

function tunePredatorMove(move: FighterMove): FighterMove {
  if (move.kind !== 'special') return move
  return {
    ...move,
    auraCost: move.category === 'finisher' ? 40 : 0,
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
      source: 'Hunter × Hunter — chapters 374–375, 381 and 388',
      evidence: 'manga-stated',
      conditions: [
        'Deduce a specific target ability personally, starting from ignorance.',
        'A live manifestation of the studied ability must be within reach.',
      ],
      prohibitions: [
        'No generic defensive enhancement or forced Zetsu on the opponent.',
        'No counter to ordinary Enhancement blows or simple Emission attacks.',
      ],
      narrativeCost: 'Successful predation seals the user’s own Nen for 48 hours.',
      narrativeEffect:
        'Conjures a specialized predator to devour the studied Nen manifestation; study duration, travel speed and supported counters are duel abstractions.',
    },
  }
}
