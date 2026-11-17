const stressCases = [
  { fighter: 'franklin', scenario: 'projectiles', stage: 'banquet-hall' },
  { fighter: 'tserriednich', scenario: 'future', stage: 'banquet-hall' },
  { fighter: 'camilla', scenario: 'post-mortem', stage: 'whale-hold' },
  { fighter: 'yokotani', scenario: 'guards', stage: 'heilly-hideout' },
  { fighter: 'biscuit', scenario: 'transformation', stage: 'whale-hold' },
]

export function fightingPerformanceCases(suite) {
  if (suite === 'stress')
    return stressCases.flatMap((entry) =>
      ['performance', 'balanced', 'quality'].map((graphics) => ({
        ...entry,
        id: `${entry.scenario}-${graphics}`,
        graphics,
        effects: true,
        dpr: 2,
        live: true,
      })),
    )
  if (suite && suite !== 'reference') throw Error(`Unknown performance suite: ${suite}`)
  return ['kurapika', 'hisoka', 'chrollo', 'benjamin'].flatMap((fighter) => [
    { id: `${fighter}-desktop`, fighter, stage: 'heavens-arena', effects: false, dpr: 1 },
    { id: `${fighter}-retina`, fighter, stage: 'heavens-arena', effects: false, dpr: 2 },
    { id: `${fighter}-effects`, fighter, stage: 'whale-hold', effects: true, dpr: 2 },
    { id: `${fighter}-bloom`, fighter, stage: 'banquet-hall', effects: true, dpr: 2 },
    { id: `${fighter}-live`, fighter, stage: 'banquet-hall', effects: true, dpr: 2, live: true },
  ])
}
