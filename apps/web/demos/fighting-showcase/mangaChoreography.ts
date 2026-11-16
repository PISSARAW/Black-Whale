import { StrategicDirector } from './strategicDirector'

/** Inspired by the duel's prepared traps, misdirection and elastic counters, with the requested On variant. */
export function createMangaShowcase() {
  const film = new StrategicDirector()
  film.cut({
    title: 'Le magicien impose le rythme.',
    subtitle: 'Ren, cartes et pression : Hisoka veut forcer le contact.',
    tags: ['REN', 'SHU', 'PRESSION'],
    gap: 19,
  })
  film.held.player = { aura: true, right: true }
  film.held.opponent = { aura: true, left: true }
  film.advance(16)
  film.held = { player: { aura: true }, opponent: {} }
  film.chain('player', ['lowLight', 'standingHeavy'])
  film.chain('opponent', ['standingLight', 'backHeavy'])
  film.held = { player: {}, opponent: {} }
  film.ready('player')
  film.retreat('player', 18)
  film.held.player = { shu: true }
  film.advance()
  film.ranged('player')
  film.held.opponent = { jump: true, ...film.direction('opponent') }
  film.advance(12)
  film.held = { player: {}, opponent: {} }
  film.aerial('opponent')

  film.beat('Le contact était un piège.', 'Chrollo dépose le Soleil. La marque reste en place.', [
    'SUN AND MOON',
    'PIÈGE',
  ])
  film.close('opponent')
  film.hit('opponent', 'neutralSpecial')
  film.book('downSpecial')
  film.chain('opponent', ['standingLight', 'backHeavy'], { aura: true })
  film.beat(
    'Hisoka a déjà préparé sa réponse.',
    'Bungee Gum dissimulé par In ; Gyo révèle le lien.',
    ['IN', 'GYO', 'BUNGEE GUM'],
  )
  film.close('player', 9)
  film.held.player = { conceal: true }
  film.held.opponent = { gyo: true }
  film.advance()
  film.hit('player', 'neutralSpecial')
  film.ready('player')
  film.held.player = {}
  film.retreat('player', 18)
  film.hit('player', 'forwardSpecial')
  film.held = { player: {}, opponent: {} }
  film.chain('player', ['lowLight', 'standingHeavy'])
  film.chain('opponent', ['lowLight', 'standingHeavy'], { aura: true })

  film.beat(
    'Premier renversement : la colère.',
    'On déchaîne la puissance physique et scelle les Hatsu au contact.',
    ['ON', 'PUISSANCE', 'VARIANTE DU JEU'],
  )
  film.ready('player')
  film.held.player = { aura: true, hatsu: true }
  film.advance(2)
  film.held.player = {}
  film.chain('player', ['lowLight', 'standingHeavy'])
  film.aerial('player')
  film.beat(
    'Chrollo refuse le duel de force.',
    'Ken absorbe les frappes et consume la réserve de On.',
    ['KEN', 'LECTURE', 'CONTRE-STRATÉGIE'],
  )
  for (let hit = 0; film.state.player.nen.on && hit < 8; hit++)
    film.guarded('player', hit % 2 ? 'forwardHeavy' : 'standingHeavy')

  film.beat(
    'Deuxième renversement : le contrat se referme.',
    'On s’éteint. Hisoka doit récupérer en Zetsu pendant que Chrollo prépare la suite.',
    ['ZETSU', 'DOUBLE FACE', 'STRATÉGIE'],
  )
  film.held.player = { down: true, aura: true }
  film.chain('opponent', ['standingLight', 'backHeavy'])
  film.chain('player', ['lowLight', 'standingHeavy'])
  film.chain('opponent', ['lowLight', 'standingHeavy'])
  film.until(() => !film.state.opponent.on?.sealFrames)
  film.held.opponent = { en: true }
  film.close('opponent', 7)
  film.advance(9)
  film.held.opponent = {}
  film.book('backSpecial')
  film.beat(
    'Black Voice choisit la distance.',
    'L’antenne impose le recul. Chrollo poursuit avant le retour de l’aura.',
    ['BLACK VOICE', 'EN', 'MANIPULATION'],
  )
  film.close('opponent')
  film.hit('opponent', 'neutralSpecial')
  film.chain('opponent', ['standingLight', 'backHeavy'], { focusHands: true })
  film.chain('player', ['lowLight', 'standingHeavy'])
  film.chain('opponent', ['lowLight', 'standingHeavy'])
  film.chain('player', ['lowLight', 'standingHeavy'])
  film.held.player = {}

  film.beat(
    'Troisième renversement : le retour du magicien.',
    'Texture Surprise masque la feinte. Ren rend chaque ouverture dangereuse.',
    ['TEXTURE SURPRISE', 'REN', 'COMBO'],
  )
  film.hit('player', 'downSpecial')
  film.chain('player', ['lowLight', 'standingHeavy'], { aura: true })
  film.aerial('player')
  film.chain('opponent', ['standingLight', 'backHeavy'])
  film.close('player')
  film.held.player = { aura: true }
  film.advance(2)
  film.move('player', 'standingHeavy', { aura: true })
  film.advance(2)
  film.held.player = {}
  film.until(() => !film.state.player.attack)

  film.beat(
    'Un dernier lien peut tout changer.',
    'Hisoka attache la gomme au milieu de son enchaînement et poursuit sa cible.',
    ['BUNGEE GUM', 'COMBO', 'POURSUITE'],
  )
  film.chain('player', ['lowLight', 'standingHeavy', 'neutralSpecial'])
  film.retreat('opponent', 14)
  film.close('player')
  film.chain('player', ['lowLight', 'standingHeavy'])

  film.beat(
    'Le Soleil n’a jamais disparu.',
    'Chrollo rouvre la page. Le signet libère sa main droite.',
    ['SUN AND MOON', 'SIGNET', 'PIÈGE FINAL'],
  )
  film.chain('opponent', ['standingLight', 'backHeavy'], { aura: true })
  film.book('backSpecial')
  film.book('downSpecial')
  for (let exchange = 0; film.state.player.health > 25 && exchange < 6; exchange++) {
    if (film.state.player.health > 65)
      film.chain('opponent', ['standingLight', 'backHeavy'], { aura: true })
    else {
      film.close('opponent')
      film.until(() => film.free('player'))
      film.hit('opponent', 'standingLight')
    }
  }
  film.beat(
    'La Lune referme le piège.',
    'Deux marques, une détonation : le plan de Chrollo aboutit.',
    ['SUN AND MOON', 'DÉTONATION', 'K.-O.'],
  )
  film.close('opponent')
  film.hit('opponent', 'finisher')
  film.until(() => film.state.phase === 'finished')
  film.caption('BLACK WHALE · CLASH', 'Duel inspiré du manga · Variante On', [
    'COMBAT CONTINU',
    'TOUR CÉLESTE',
  ])
  film.advance(40)
  return film
}
