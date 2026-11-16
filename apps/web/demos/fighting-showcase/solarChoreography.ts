import { SolarDirector } from './solarDirector'

export function createSolarShowcase() {
  const f = new SolarDirector()
  f.cut({
    player: 'feitan',
    opponent: 'tserriednich',
    stageId: 'tserriednich-salon',
    gap: 7,
    ren: true,
    title: 'Feitan ouvre les hostilités.',
    subtitle: 'Une attaque directe. Le prince attend le moment de contrer.',
    tags: ['FEITAN', 'TSERRIEDNICH', 'REN'],
  })
  f.held = { player: { aura: true }, opponent: { aura: true } }
  f.advance(8)
  f.held = { player: {}, opponent: {} }
  f.close('player')
  f.move('player', 'standingHeavy')
  f.advance(2)
  f.move('opponent', 'standingLight')
  f.until(() => f.free('opponent'))
  f.beat(
    'Tserriednich trouve la faille.',
    'Le contre coupe l’élan de Feitan. Les échanges se resserrent.',
    ['CONTRE', 'CORPS-À-CORPS'],
  )
  for (let i = 0; i < 3; i++) {
    f.exchange('player')
    f.exchange('opponent')
  }
  f.beat(
    'Chaque blessure nourrit Pain Packer.',
    'Le prince prend l’avantage. La douleur de Feitan devient sa réserve de puissance.',
    ['PAIN PACKER', 'PRESSION', 'COMBOS'],
  )
  for (let i = 0; i < 5 && f.state.player.health > 85; i++) {
    f.exchange('opponent')
    if (i % 2 === 0) f.chain('player', ['lowLight', 'standingHeavy'])
    f.exchange('opponent')
  }
  f.beat(
    'Pain Packer : la douleur engagée.',
    'Feitan revêt l’armure et prépare le soleil. Tserriednich cherche de l’espace.',
    ['PAIN PACKER', 'ARMURE'],
  )
  f.hit('player', 'neutralSpecial')
  f.ready('player')
  for (let i = 0; Math.abs(f.state.player.x - f.state.opponent.x) < 36.5 && i < 120; i++)
    f.retreat('opponent', 2)
  f.ready('opponent')
  f.beat(
    'Rising Sun. Laplace Devil.',
    'Le soleil se prépare. Le prince ferme les yeux et entre en Zetsu.',
    ['RISING SUN', 'LAPLACE DEVIL', 'ZETSU'],
  )
  f.move('player', 'finisher')
  f.move('opponent', 'neutralSpecial')
  f.held.player = { guard: true }
  f.until(() => f.state.parallelFuture?.phase === 'vision', 90)
  f.advance(18)
  f.beat(
    'Un futur mortel. Une autre trajectoire.',
    'Le prince rouvre les yeux et quitte la zone de chaleur. Feitan perçoit encore le futur prédit.',
    ['VISION +10 S', 'DIVERGENCE', 'ESQUIVE RÉELLE'],
  )
  f.move('opponent', 'finisher')
  f.retreat('opponent', 30)
  while (f.state.player.hatsuEffects.painPacker?.sun && f.state.phase === 'fighting') {
    f.held.opponent = { ...f.direction('opponent', true), jump: true }
    f.advance(28)
    f.held.opponent = { guard: true }
    f.advance(18)
  }
  f.held.opponent = {}
  f.beat(
    'Le soleil s’éteint. Le prince revient.',
    'La protection thermique disparaît. Tserriednich referme la distance pendant la divergence.',
    ['FIN DE RISING SUN', 'RETOUR AU CONTACT'],
  )
  f.close('opponent')
  while (f.state.parallelFuture && f.state.phase === 'fighting') {
    f.chain('opponent', ['standingLight', 'backHeavy'])
    f.ready('opponent')
  }
  f.held.player = {}
  f.beat(
    'Dix secondes écoulées. Le coup décisif.',
    'La vision est terminée. Tserriednich achève Feitan au corps-à-corps.',
    ['CONTRE-ATTAQUE', 'K.-O.'],
  )
  for (let i = 0; i < 15 && f.state.phase === 'fighting'; i++) f.exchange('opponent')
  f.caption(
    'TSERRIEDNICH · VICTOIRE',
    'Rising Sun a expiré. La dernière frappe atteint le corps réel de Feitan.',
    ['LAPLACE DEVIL', 'K.-O.'],
  )
  f.advance(70)
  return f
}
