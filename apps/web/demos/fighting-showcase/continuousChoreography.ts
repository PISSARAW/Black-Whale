import { ContinuousDirector } from './continuousDirector'

/** A single match. Recovery, aura management and counter-attacks overlap throughout. */
export function createContinuousShowcase() {
  const film = new ContinuousDirector()
  film.cut({
    title: 'HISOKA × CHROLLO',
    subtitle: 'Tour céleste · Combat continu',
    tags: ['TEN', 'REN'],
    gap: 17,
  })
  film.held.player = { aura: true, right: true }
  film.held.opponent = { aura: true, left: true }
  film.advance(14)
  film.held = { player: {}, opponent: {} }
  film.chain('player', ['lowLight', 'standingHeavy'])
  film.chain('opponent', ['standingLight', 'backHeavy'])
  film.caption(
    'Lire la garde. Trouver l’ouverture.',
    'Ken absorbe la frappe. Ryu déplace la pression.',
    ['KEN', 'RYU', 'RIPOSTE'],
  )
  film.close('player', 7)
  film.held.opponent = { guard: true, aura: true }
  film.advance(7)
  film.hit('player', 'forwardHeavy')
  film.ready('player')
  film.held.opponent = {}
  film.chain('opponent', ['standingLight', 'backHeavy'], { focusHands: true })
  film.chain('player', ['lowLight', 'standingHeavy'], { focusFeet: true })

  film.caption(
    'Sous la feinte, le Hatsu.',
    'Texture Surprise, puis une attache dissimulée par In.',
    ['TEXTURE SURPRISE', 'IN', 'GYO'],
  )
  film.hit('player', 'downSpecial')
  film.close('opponent', 9)
  film.held.player = { conceal: true }
  film.held.opponent = { gyo: true }
  film.advance()
  film.hit('player', 'neutralSpecial')
  film.ready('player')
  film.retreat('player', 18)
  film.caption(
    'Le lien change la distance.',
    'Rappel et frappe : le corps-à-corps reprend immédiatement.',
    ['BUNGEE GUM', 'RAPPEL', 'COMBO'],
  )
  film.hit('player', 'forwardSpecial')
  film.held = { player: {}, opponent: {} }
  film.held.player = { down: true, aura: true }
  film.chain('player', ['lowLight', 'standingHeavy'])
  film.chain('opponent', ['standingLight', 'backHeavy'])
  film.chain('player', ['lowLight', 'standingHeavy'])

  film.caption(
    'Chrollo reprend l’initiative.',
    'Hisoka récupère en Zetsu sous la pression du voleur.',
    ['ZETSU', 'SKILL HUNTER', 'COMBO'],
  )
  film.held.player = { down: true, aura: true }
  film.chain('opponent', ['standingLight', 'backHeavy'])
  film.close('opponent')
  film.hit('opponent', 'neutralSpecial')
  film.book('downSpecial')
  film.close('opponent')
  film.caption('Soleil. Signet. Lune.', 'Sun and Moon explose au second contact.', [
    'SUN AND MOON',
    'DOUBLE FACE',
  ])
  film.hit('opponent', 'finisher')
  film.held.player = {}
  film.aerial('player')
  film.chain('opponent', ['standingLight', 'backHeavy'])

  film.caption(
    'Cartes en vol. Pression au sol.',
    'Shu renforce le projectile ; Chrollo cherche l’approche.',
    ['SHU', 'ESQUIVE', 'AIR COMBO'],
  )
  film.ready('player')
  film.retreat('player', 22)
  film.held.player = { shu: true }
  film.advance()
  film.ranged('player')
  film.held.opponent = { jump: true, ...film.direction('opponent') }
  film.advance(13)
  film.held.opponent = {}
  film.execute('opponent', 'airHeavy')
  film.held.player = {}
  film.chain('player', ['lowLight', 'standingHeavy'])

  film.caption(
    'Une page suffit à renverser l’échange.',
    'Black Voice impose son ordre. Hisoka cherche une nouvelle ouverture.',
    ['BLACK VOICE', 'EN', 'MANIPULATION'],
  )
  film.book('backSpecial')
  film.held.player = { down: true, aura: true }
  film.held.opponent = { en: true }
  film.close('opponent')
  film.advance(8)
  film.held.opponent = {}
  film.hit('opponent', 'neutralSpecial')
  film.chain('opponent', ['standingLight', 'backHeavy'])
  film.held.player = {}
  film.chain('player', ['lowLight', 'standingHeavy'])
  film.aerial('opponent')

  film.caption(
    'Ko : tout sur l’impact.',
    'Une concentration brève, une ouverture, un coup critique.',
    ['KO', 'CONTRE', 'COMBO'],
  )
  film.close('player')
  film.ready('player')
  film.held.player = { aura: true }
  film.advance(2)
  film.move('player', 'standingHeavy', { aura: true })
  film.advance(2)
  film.held.player = {}
  film.until(() => !film.state.player.attack)
  film.chain('opponent', ['standingLight', 'backHeavy'])
  film.chain('player', ['lowLight', 'standingHeavy'])
  film.chain('opponent', ['standingLight', 'backHeavy'])

  film.caption(
    'Récupérer sans rompre le rythme.',
    'Hisoka ferme son aura et enchaîne ses frappes physiques.',
    ['ZETSU', 'CORPS-À-CORPS', 'COMBO'],
  )
  film.held.player = { down: true, aura: true }
  film.chain('player', ['lowLight', 'standingHeavy'])
  film.chain('player', ['lowLight', 'standingHeavy'])
  film.chain('player', ['lowLight', 'standingHeavy'])
  film.chain('player', ['lowLight', 'standingHeavy'])
  film.until(() => film.free('opponent'))
  film.close('player')
  film.hit('player', 'throw')
  film.chain('player', ['lowLight', 'standingHeavy'])
  film.held.player = {}

  film.caption(
    'Le magicien reprend la main.',
    'Attache confirmée, enchaînement et exécution élastique.',
    ['BUNGEE GUM', 'COMBO', 'EXÉCUTION'],
  )
  film.chain('player', ['lowLight', 'standingHeavy', 'neutralSpecial'])
  film.close('player')
  film.held.player = { aura: true }
  film.hit('player', 'finisher')
  film.held.player = {}
  film.until(() => film.free('opponent') && film.free('player'))
  film.caption('BLACK WHALE · CLASH', 'Hisoka × Chrollo · Tour céleste', [
    'COMBAT CONTINU',
    'MODE FIGHTING',
  ])
  film.advance(36)
  if (film.states.length % 2) film.advance()
  return film
}
