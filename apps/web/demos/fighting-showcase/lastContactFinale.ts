import type { LastContactDirector } from './lastContactDirector'

export function lastContactOn(f: LastContactDirector) {
  f.mark('La colère ne suffit pas', 'On consume le corps. Ken consume sa réserve.', [
    'ON · VARIANTE DU JEU',
    'KEN',
  ])
  f.ready('player')
  f.held.player = { aura: true, hatsu: true }
  f.advance(2)
  f.held.player = {}
  if (!f.state.player.nen.on) throw Error('On did not activate')
  f.physical('player', 1)
  f.aerial('player')
  for (let i = 0; f.state.player.nen.on && i < 10; i++)
    f.guarded('player', i % 2 ? 'forwardHeavy' : 'standingHeavy')
  f.held.player = { down: true, aura: true }
  f.exchange(8)
  f.held.player = {}
  f.recover('player', 75)
  f.recover('opponent', 75)
}

export function lastContactFinale(f: LastContactDirector) {
  f.mark(
    'Tout miser sur la dernière ouverture',
    'Changer de niveau. Casser le rythme. Revenir au contact.',
    ['RYU', 'KO', 'REN'],
  )
  f.held.opponent = { en: true }
  f.advance(15)
  f.held.opponent = {}
  f.exchange(8)
  for (const side of ['player', 'opponent'] as const) {
    f.chain(
      side,
      side === 'player'
        ? ['standingLight', 'standingHeavy', 'backHeavy']
        : ['standingLight', 'backHeavy', 'forwardLight'],
      { focusHands: true },
    )
    f.close(side)
    f.ready(side)
    f.held[side] = { aura: true }
    f.advance(2)
    f.move(side, 'standingHeavy', { aura: true })
    f.advance(2)
    f.held[side] = {}
    f.ready(side)
    f.aerial(side)
  }
  // Extend through alternating native confirms; no health or aura reset.
  let index = 0
  while (f.states.length < 10000 && f.state.phase === 'fighting') {
    f.physical(index % 2 ? 'player' : 'opponent', index)
    index++
  }
  f.recover('player', 100)
  f.recover('opponent', 65)
  f.page('sun-and-moon')
  f.poseBook()
  // The early mark remains. Bring health within the native detonation's reach.
  for (let i = 0; f.state.player.health > 26 && i < 220; i++) {
    if (f.state.player.health > 70) f.physical('opponent', i)
    else {
      f.close('opponent')
      f.ready('player')
      f.hit('opponent', 'standingLight')
      f.ready('opponent')
    }
  }
  f.mark('Le dernier lien', 'Hisoka croit tenir la distance.', ['BUNGEE GUM'])
  f.chain('player', ['standingLight', 'forwardLight', 'forwardHeavy', 'neutralSpecial'])
  f.ready('player')
  f.ready('opponent')
  f.move('player', 'finisher')
  f.advance(14)
  f.held.opponent = { guard: true, aura: true }
  f.advance(12)
  f.held.opponent = {}
  f.mark('Le Soleil n’a jamais disparu', 'La main droite était la dernière pièce du piège.', [
    'SUN AND MOON',
    'DERNIER CONTACT',
  ])
  f.close('opponent')
  f.hit('opponent', 'finisher')
  f.until(() => f.state.phase === 'finished', 180)
  if (f.state.winner !== 'opponent')
    throw Error(`Final detonation did not win ${f.state.player.health}`)
  f.caption('LE DERNIER CONTACT', 'La première marque décide du dernier échange.')
  f.advance(180)
}
