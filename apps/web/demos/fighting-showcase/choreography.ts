import { Showcase } from './timeline'

export function createShowcase() {
  const film = new Showcase()

  film.cut({
    title: 'HISOKA × CHROLLO',
    subtitle: 'Un duel. Toutes les dimensions du Nen.',
    tags: ['MODE FIGHTING', 'TOUR CÉLESTE'],
    gap: 32,
    card: 'intro',
  })
  film.step(240)

  film.cut({
    title: 'Chaque ouverture se mérite.',
    subtitle: 'Ten stabilise l’aura. Ren augmente la pression. Ken encaisse.',
    tags: ['TEN', 'REN', 'KEN'],
    gap: 10,
  })
  film.step(60)
  film.step(70, { aura: true }, { aura: true })
  film.step(20, { guard: true, aura: true })
  film.move('opponent', 'forwardHeavy')
  film.step(70, { guard: true, aura: true })
  film.caption(
    'Défendre. Puis reprendre l’initiative.',
    'Garde renforcée, approche, coups bas et contre-attaque.',
    ['KEN', 'GARDE', 'CONTRE'],
  )
  film.combo('player', ['lowLight', 'standingHeavy', 'neutralSpecial'])
  film.approach('opponent')
  film.move('opponent', 'lowHeavy')
  film.settle(85)
  film.step(20, { left: true })
  film.step(1)
  film.move('player', 'backSpecial')
  film.settle(65)
  film.pad(10)

  film.cut({
    title: 'Disparaître dans le rythme.',
    subtitle: 'Zetsu coupe l’aura et permet de récupérer. Le corps reste vulnérable.',
    tags: ['ZETSU', 'RÉCUPÉRATION'],
    gap: 22,
  })
  film.step(110, { down: true, aura: true }, { guard: true })
  film.caption(
    'Lire l’espace avec En.',
    'Chrollo déploie son champ de perception. Hisoka reprend l’approche.',
    ['EN', 'PERCEPTION'],
  )
  film.step(90, {}, { en: true })
  film.step(20, { right: true }, { en: true })
  film.step(1)
  film.step(12, { right: true, jump: true })
  film.move('player', 'airLight')
  film.step(8)
  film.move('player', 'airHeavy')
  film.settle(70)
  film.approach('opponent')
  film.move('opponent', 'throw')
  film.settle(85)
  film.pad(9)

  film.cut({
    title: 'Une carte devient une arme.',
    subtitle: 'Shu enveloppe les cartes d’aura. La distance et la garde comptent.',
    tags: ['SHU', 'PROJECTILES', 'ESQUIVE'],
    gap: 28,
  })
  film.step(35, { shu: true }, { guard: true })
  film.ranged('player')
  film.step(65, { shu: true }, { guard: true })
  film.ranged('player')
  film.step(16, { shu: true })
  film.step(38, { shu: true }, { jump: true, left: true })
  film.step(20)
  film.caption(
    'La portée ne fait pas tout.',
    'Saut d’approche, attaque aérienne et retour au corps-à-corps.',
    ['SAUT', 'AIR COMBO'],
  )
  film.approach('opponent', 11)
  film.step(9, {}, { jump: true, left: true })
  film.move('opponent', 'airHeavy')
  film.settle(65)
  film.combo('player', ['lowLight', 'standingHeavy'])
  film.caption(
    'Le détail fait partie de la feinte.',
    'Texture Surprise modifie l’apparence du tissu, sans protéger le corps.',
    ['TEXTURE SURPRISE', 'HATSU'],
  )
  film.move('player', 'downSpecial')
  film.settle(75)
  film.pad(9)

  film.cut({
    title: 'Ce que l’œil ne voit pas.',
    subtitle: 'In dissimule l’aura du Hatsu. Gyo permet à Chrollo de la lire.',
    tags: ['IN', 'GYO', 'HATSU'],
    gap: 13,
  })
  film.step(45, { conceal: true })
  film.move('player', 'neutralSpecial')
  film.step(65, { conceal: true })
  film.step(90, {}, { gyo: true })
  film.caption(
    'Bungee Gum. Attacher, puis attirer.',
    'Le lien reste tendu : Hisoka rappelle son adversaire avant de frapper.',
    ['BUNGEE GUM', 'RAPPEL', 'COMBO'],
  )
  film.step(32, { left: true }, { gyo: true })
  film.step(1)
  film.move('player', 'forwardSpecial')
  film.settle(65)
  film.combo('player', ['lowLight', 'standingHeavy'])
  film.pad(11)

  film.cut({
    title: 'Skill Hunter ouvre le jeu.',
    subtitle: 'Sun and Moon : poser le Soleil, placer le signet, fermer le livre.',
    tags: ['HATSU', 'SKILL HUNTER', 'DOUBLE FACE'],
    gap: 5,
  })
  film.step(70)
  film.move('opponent', 'neutralSpecial')
  film.settle(65)
  film.move('opponent', 'downSpecial')
  film.settle(65)
  film.caption(
    'Deux marques. Une détonation.',
    'La page au signet reste active. Le contact de la Lune déclenche l’explosion.',
    ['SUN AND MOON', 'SIGNET', 'DÉTONATION'],
  )
  film.approach('opponent')
  film.move('opponent', 'finisher')
  film.settle(100)
  film.approach('player')
  film.combo('player', ['lowLight', 'standingHeavy'])
  film.pad(10)

  film.cut({
    title: 'Changer de page. Changer de menace.',
    subtitle: 'Double Face conserve Sun and Moon au signet. Black Voice prend le relais.',
    tags: ['DOUBLE FACE', 'BLACK VOICE'],
    gap: 7,
  })
  film.step(40)
  film.move('opponent', 'downSpecial')
  film.settle(45)
  film.move('opponent', 'backSpecial')
  film.settle(55)
  film.combo('opponent', ['standingLight', 'backHeavy', 'neutralSpecial'])
  film.approach('opponent')
  film.move('opponent', 'neutralSpecial')
  film.settle(40)
  film.caption(
    'La manipulation brise le tempo.',
    'L’antenne touche : Black Voice impose un ordre de déplacement.',
    ['BLACK VOICE', 'MANIPULATION'],
  )
  film.step(100)
  film.pad(9)

  film.cut({
    title: 'Déplacer l’aura. Créer l’ouverture.',
    subtitle: 'Ryu concentre l’aura sur une zone. La protection ailleurs diminue.',
    tags: ['RYU', 'MAINS 76 %', 'PIEDS 76 %'],
    gap: 7,
  })
  film.step(70, { focusHands: true }, { focusTorso: true, guard: true })
  film.move('player', 'forwardLight')
  film.step(60, { focusHands: true }, { guard: true, focusTorso: true })
  film.combo('opponent', ['standingLight', 'backHeavy'], { focusHands: true })
  film.caption(
    'Ko. Tout miser sur un impact.',
    'Charger l’attaque, relâcher l’aura : la concentration engage tout le corps.',
    ['KO', 'IMPACT CRITIQUE'],
  )
  film.approach('player')
  film.step(10, { aura: true })
  film.move('player', 'standingHeavy', { aura: true })
  film.step(2, { aura: true })
  film.step(90)
  film.step(50, { focusFeet: true })
  film.pad(10)

  film.cut({
    title: 'Le combat est une suite de choix.',
    subtitle: 'Un enchaînement confirmé. Une attache. La distance devient une ressource.',
    tags: ['COMBO', 'BUNGEE GUM'],
    gap: 7,
  })
  film.settle(75)
  film.combo('player', ['standingLight', 'neutralSpecial'])
  film.step(30, { left: true })
  film.step(1)
  film.caption(
    'Approche. Enchaînement. Exécution.',
    'Hisoka reprend le contact, enchaîne ses frappes et consomme le lien pour conclure.',
    ['BUNGEE GUM', 'COMBO', 'EXÉCUTION ÉLASTIQUE'],
  )
  film.approach('player')
  film.settle(65)
  film.combo('player', ['lowLight', 'standingHeavy'])
  film.approach('player')
  film.move('player', 'finisher')
  film.settle(95)
  film.pad(11)

  film.caption('BLACK WHALE', 'Maîtrisez le Nen. Inventez votre combat.', [
    'MODE FIGHTING',
    'HISOKA × CHROLLO',
    'TOUR CÉLESTE',
  ])
  film.card = 'outro'
  film.step(240)
  return film
}
