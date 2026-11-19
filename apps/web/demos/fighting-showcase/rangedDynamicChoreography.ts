import { RangedDynamicDirector } from './rangedDynamicDirector'

export function createDynamicRangedDuel() {
  const f = new RangedDynamicDirector()
  f.cut({
    player: 'leorio',
    opponent: 'franklin',
    stageId: 'princes-burial-chamber',
    gap: 26,
    title: 'LEORIO × FRANKLIN · AUCUNE LIGNE DROITE',
    subtitle: 'Les rafales verrouillent la chambre. Le sol offre une autre trajectoire.',
    tags: ['CHAMBRE FUNÉRAIRE', 'COMBAT CONTINU', 'DUEL D’ÉMISSION'],
  })
  for (const side of ['player', 'opponent'] as const)
    f.state[side] = { ...f.state[side], health: 600, maxHealth: 600 }
  f.advance(10)
  f.fire()
  f.caption(
    'Le poing arrive. Franklin a déjà bougé.',
    'La sortie est fixe : Leorio doit choisir son instant.',
    ['POING À DISTANCE', 'ESQUIVE'],
  )
  f.remote(true)
  f.punishCast()
  f.caption(
    'Leorio casse la distance.',
    'Laisser tirer, approcher, puis frapper entre deux rafales.',
    ['ESQUIVE', 'COMBOS', 'PRESSION'],
  )
  f.fire('downSpecial', 'jump')
  f.combos('player', 5)
  f.remote()
  f.caption(
    'Franklin retourne la pression.',
    'Leorio ne peut pas rester au contact : la riposte le repousse.',
    ['CONTRE-ATTAQUE', 'COMBOS'],
  )
  f.combos('opponent', 6)
  f.fire('forwardSpecial')
  f.caption(
    'Changer de niveau, changer d’angle.',
    'Leorio reprend l’initiative par le bas, puis traverse la garde.',
    ['RYU', 'COMBOS', 'REPRISE'],
  )
  f.combos('player', 6)
  f.remote()
  f.caption(
    'La rafale piège la sortie.',
    'Franklin reprend le centre et oblige Leorio à subir un nouvel échange.',
    ['DOUBLE MACHINE GUN', 'PRESSION'],
  )
  f.fire('forwardSpecial')
  f.combos('opponent', 6)
  f.caption(
    'La garde tient. Leorio répond.',
    'Absorber la pression, raccourcir la distance et repartir en combo.',
    ['TEN', 'GARDE', 'RIPOSTE'],
  )
  f.fire('forwardSpecial', 'guard')
  f.combos('player', 4)
  f.remote()
  f.fire('forwardSpecial', 'jump')
  f.caption(
    'Il regarde les mains. Leorio vise le sol.',
    'Dernière approche : préparer le contre pendant que Franklin s’engage.',
    ['LECTURE DU TEMPO', 'DERNIER ÉCHANGE'],
  )
  for (let i = 0; i < 20 && f.state.opponent.health > 45 && f.state.phase === 'fighting'; i++)
    f.physical('player', i % 2 === 0)
  for (let i = 0; i < 12 && f.state.opponent.health > 12 && f.state.phase === 'fighting'; i++) {
    f.close('player')
    f.ready('player')
    f.ready('opponent')
    f.execute('player', 'standingLight')
  }
  f.finalCounter()
  f.caption(
    'LEORIO · LE CONTRE VIENT DU SOL',
    'La rafale est engagée. Le poing à distance la coupe.',
    ['CONTRE', 'POING À DISTANCE', 'K.-O.'],
  )
  f.advance(70)
  return f
}
