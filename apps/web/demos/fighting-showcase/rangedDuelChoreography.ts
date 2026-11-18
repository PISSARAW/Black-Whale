import { RangedDuelDirector } from './rangedDuelDirector'

export function createRangedDuel() {
  const f = new RangedDuelDirector()
  f.cut({
    player: 'leorio',
    opponent: 'franklin',
    stageId: 'princes-burial-chamber',
    gap: 26,
    title: 'Leorio face à une machine de guerre.',
    subtitle:
      'Dans la chambre funéraire, Franklin ouvre le feu. Leorio doit trouver une autre trajectoire.',
    tags: ['CHAMBRE FUNÉRAIRE', 'DUEL À DISTANCE', 'DOUBLE MACHINE GUN'],
  })
  for (const side of ['player', 'opponent'] as const)
    f.state[side] = { ...f.state[side], health: 400, maxHealth: 400 }
  f.advance(10)
  f.fire()
  f.caption(
    'Franklin ne reste pas sur la cible.',
    'Le poing émerge au point visé. Un déplacement suffit à lui échapper.',
    ['POING À DISTANCE', 'POINT DE SORTIE FIXE'],
  )
  f.remote(true)
  f.fire('neutralSpecial', 'jump')
  f.physical('player')
  f.physical('player', true)
  f.caption(
    'Leorio passe sous les rafales.',
    'Garde, approche et changement de niveau : chaque échange coûte de l’aura.',
    ['TEN', 'GARDE', 'COMBOS'],
  )
  f.physical('opponent')
  f.physical('player')
  f.fire('forwardSpecial', 'guard')
  f.remote()
  f.fire('downSpecial', 'jump')
  for (let i = 0; i < 3; i++) {
    f.physical('player', i % 2 === 0)
    f.physical('opponent', i % 2 !== 0)
    f.physical('player')
  }
  f.caption(
    'La ligne droite contre le détour.',
    'Les balles traversent la salle ; l’aura de Leorio circule sous leurs pieds.',
    ['ÉMISSION', 'DOUBLE MACHINE GUN', 'POING À DISTANCE'],
  )
  f.remote()
  f.fire('forwardSpecial', 'guard')
  f.physical('opponent', true)
  f.physical('player')
  f.physical('player', true)
  f.fire('forwardSpecial', 'jump')
  f.caption(
    'Franklin prépare sa plus longue rafale.',
    'Leorio le force à se fixer. Il a déjà choisi le point où le sol va s’ouvrir.',
    ['LECTURE DU TEMPO', 'PRESSION', 'DERNIER ÉCHANGE'],
  )
  for (let i = 0; i < 18 && f.state.opponent.health > 45 && f.state.phase === 'fighting'; i++)
    f.physical('player', i % 2 === 0)
  for (let i = 0; i < 12 && f.state.opponent.health > 12 && f.state.phase === 'fighting'; i++) {
    f.close('player')
    f.ready('player')
    f.ready('opponent')
    f.execute('player', 'standingLight')
  }
  f.caption(
    'Il surveillait les mains. Le coup vient du sol.',
    'Le poing de Leorio surgit pendant la rafale engagée.',
    ['POING À DISTANCE', 'CONTRE', 'RETOURNEMENT'],
  )
  f.finalCounter()
  f.caption('LEORIO · VICTOIRE', 'Une trajectoire que les balles ne pouvaient pas intercepter.', [
    'POING À DISTANCE',
    'K.-O.',
  ])
  f.advance(70)
  return f
}
