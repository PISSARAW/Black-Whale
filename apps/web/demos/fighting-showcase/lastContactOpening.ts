import type { LastContactDirector } from './lastContactDirector'

export function lastContactOpening(f: LastContactDirector) {
  f.held = { player: { aura: true }, opponent: { aura: true } }
  f.advance(28)
  f.held = { player: {}, opponent: {} }
  f.mark('Le premier contact', 'Un geste presque anodin.', ['REN', 'SUN AND MOON'])
  f.chain('opponent', ['standingLight', 'backHeavy', 'neutralSpecial'])
  if (!f.state.player.hatsuEffects.sunMark) throw Error('Opening Sun mark missing')
  f.exchange(7)
  f.mark('Le magicien impose son rythme', 'La distance appartient à celui qui la prépare.', [
    'BUNGEE GUM',
    'IN',
    'GYO',
  ])
  f.close('player')
  f.ready('player')
  f.ready('opponent')
  f.held.player = { conceal: true }
  for (const slot of ['standingLight', 'forwardLight', 'forwardHeavy', 'neutralSpecial'] as const) {
    f.advance()
    f.execute('player', slot)
  }
  f.held.player = {}
  f.ready('player')
  if (!f.state.bungeeGum) throw Error('Gum not attached')
  f.held.player = { conceal: true }
  f.held.opponent = { gyo: true }
  f.retreat('player', 25)
  f.held.player = {}
  f.advance()
  f.hit('player', 'forwardSpecial')
  f.ready('player')
  f.held = { player: {}, opponent: {} }
  f.exchange(4)
  f.retreat('opponent', 30)
  f.hit('player', 'backSpecial')
  f.held = { player: {}, opponent: {} }
  f.aerial('player')
  f.held.player = { shu: true }
  f.retreat('player', 24)
  f.projectile('player')
  f.advance(42)
  f.held.player = {}
  f.exchange(5)
}

export function lastContactCopies(f: LastContactDirector) {
  f.mark('Un adversaire de trop', 'Copier le corps. Marquer la copie. Lui donner un ordre.', [
    'GALLERY FAKE',
    'ORDER STAMP',
  ])
  f.recover('opponent', 75)
  f.close('opponent')
  f.page('gallery-fake')
  f.poseBook()
  f.command('opponent', { action: 'history-use', target: 'player' })
  f.ready('opponent')
  const copy = f.state.battlefield!.entities.find((e) => e.copy)!
  f.poseBook()
  f.page('sun-and-moon')
  // The copy is behind Chrollo. Turn towards it before placing the left-hand mark.
  f.held.opponent = { ...f.direction('opponent', true), jump: true }
  f.advance(22)
  f.held.opponent = {}
  f.ready('opponent')
  f.walk('opponent', copy.x + (f.state.opponent.x < copy.x ? -6 : 6))
  f.stampCopy()
  if (!f.state.battlefield!.entities.find((e) => e.id === copy.id)?.arena?.sun)
    throw Error('Copy Sun mark missing')
  f.page('order-stamp')
  f.command('opponent', { action: 'history-use', target: copy.id })
  f.advance(25)
  f.held.player = { guard: true, aura: true }
  f.advance(50)
  f.held.player = {}
  // Actual head-targeting physical hitboxes destroy the animated copy.
  for (
    let i = 0;
    i < 10 && (f.state.battlefield!.entities.find((e) => e.id === copy.id)?.health ?? 0) > 0;
    i++
  ) {
    const target = f.state.battlefield!.entities.find((e) => e.id === copy.id)!
    f.walk('player', target.x + (f.state.player.x < target.x ? -5 : 5))
    f.hit('player', 'standingLight')
    f.ready('player')
  }
  f.page('convert-hands')
  f.close('opponent')
  f.command('opponent', { action: 'history-shape-left' })
  f.advance(22)
  f.physical('opponent', 1)
  f.page('sun-and-moon')
  f.exchange(5)
}
