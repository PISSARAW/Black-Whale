import { createBallroomShowcase, type BallroomPhase } from './ballroomChoreography'
import { LongBallroomDirector } from './longBallroomDirector'

function opening(f: LongBallroomDirector) {
  f.beat(
    'Changer de niveau. Changer de rythme.',
    'Chaîne basse, frappes hautes et redistribution de l’aura : aucun échange ne se joue au même endroit.',
    ['COMBOS', 'RYU', 'DISTANCE'],
  )
  for (let i = 0; i < 3; i++) {
    f.string('player', i % 2 === 0)
    f.string('opponent', i % 2 === 1)
  }
  f.volley(true)
  f.beat(
    'Le recul prépare le contre.',
    'Benjamin engage la charge. Kurapika revient pendant la récupération.',
    ['ESQUIVE', 'DASH', 'PUNITION'],
  )
  f.punish()
  f.string('opponent', true)
}

function range(f: LongBallroomDirector) {
  f.beat(
    'La salle devient une ligne de tir.',
    'Les rafales obligent Kurapika à changer de hauteur et à choisir son approche.',
    ['RAFALE', 'APPROCHE AÉRIENNE'],
  )
  f.volley(true)
  f.aerial('player')
  f.string('opponent', true)
  f.volley(false)
  f.beat(
    'La chaîne divinatoire garde sa portée.',
    'La main guide le pendule pendant que Benjamin cherche à rentrer dans la garde.',
    ['DOWSING CHAIN', 'CONTRÔLE DE DISTANCE'],
  )
  f.dowsing()
  f.string('opponent')
  f.string('player', true)
  f.heal()
}

function recovery(f: LongBallroomDirector) {
  f.beat(
    'Le serment est tombé. Le duel continue.',
    'Les réserves se reforment sous la pression des frappes physiques.',
    ['ZETSU', 'CONTRE-JEU', 'COMBO'],
  )
  f.reserve('player', 65)
  f.reserve('opponent', 65)
  for (let i = 0; i < 3; i++) {
    f.string('player', true)
    f.string('opponent', i % 2 === 0)
  }
  f.volley(true)
  f.aerial('player')
  f.heal()
}

function emperor(f: LongBallroomDirector) {
  f.beat(
    'Emperor Time : les yeux écarlates.',
    'Le combat continue pendant le gros plan : Benjamin prend du recul pour préparer sa riposte.',
    ['EMPEROR TIME', 'YEUX ÉCARLATES'],
  )
  f.retreat('opponent', 32)
  f.volley(false)
  f.string('player', true)
  f.string('opponent', true)
  f.beat(
    'La distance ne protège plus le prince.',
    'Kurapika alterne approche, chaîne divinatoire et sortie de garde.',
    ['EMPEROR TIME', 'CHAÎNES', 'COMBOS'],
  )
  f.dowsing()
  f.string('opponent')
  f.heal()
  f.string('player', true)
  f.volley(true)
  f.punish()
  f.reserve('player', 85)
  if (!f.state.player.kurapika?.emperorTime) f.emperor()
}

export function createLongBallroomShowcase() {
  const director = new LongBallroomDirector()
  const phases: Record<BallroomPhase, (f: LongBallroomDirector) => void> = {
    opening,
    range,
    recovery,
    emperor,
  }
  return createBallroomShowcase({
    director,
    initialHealth: 600,
    interlude: (f, phase) => phases[phase](f as LongBallroomDirector),
  }) as LongBallroomDirector
}
