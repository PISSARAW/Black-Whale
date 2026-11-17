import { BallroomDirector } from './ballroomDirector'

export type BallroomPhase = 'opening' | 'range' | 'recovery' | 'emperor'
export function createBallroomShowcase(
  options: {
    director?: BallroomDirector
    initialHealth?: number
    interlude?: (director: BallroomDirector, phase: BallroomPhase) => void
  } = {},
) {
  const f = options.director ?? new BallroomDirector()
  f.cut({
    player: 'kurapika',
    opponent: 'benjamin',
    stageId: 'banquet-hall',
    ren: true,
    title: 'Deux Ren. Aucun recul.',
    subtitle: 'Kurapika × Benjamin · Salle de bal',
    tags: ['REN · KURAPIKA', 'REN · BENJAMIN'],
    gap: 16,
  })
  if (options.initialHealth)
    for (const side of ['player', 'opponent'] as const)
      f.state[side] = {
        ...f.state[side],
        health: options.initialHealth,
        maxHealth: options.initialHealth,
      }
  f.prepareCard()
  f.held = { player: { aura: true, right: true }, opponent: { aura: true, left: true } }
  f.advance(16)
  f.held = { player: {}, opponent: {} }
  f.chain('player', ['standingLight', 'standingHeavy'])
  f.chain('opponent', ['lowLight', 'standingHeavy'])
  f.beat(
    'La défense décide du tempo.',
    'Ken absorbe la pression. Ten stabilise le retour à l’échange.',
    ['KEN', 'TEN', 'RIPOSTE'],
  )
  f.guarded('opponent', 'forwardHeavy')
  f.guarded('player', 'forwardHeavy')
  f.chain('player', ['standingLight', 'standingHeavy'], { focusHands: true })
  f.chain('opponent', ['lowLight', 'standingHeavy'], { focusFeet: true })
  options.interlude?.(f, 'opening')

  f.beat(
    'Benjamin Baton : l’héritage des soldats.',
    'Air Blow impose la puissance ; Secret Window marque sa cible au contact.',
    ['AIR BLOW', 'SECRET WINDOW'],
  )
  f.close('opponent')
  f.hit('opponent', 'neutralSpecial')
  f.close('opponent', 4.5)
  f.until(() => f.free('player'))
  f.hit('opponent', 'forwardSpecial')
  f.ready('opponent')
  f.beat(
    'Culdcept rejoue sa carte.',
    'Benjamin libère un projectile de Nen capturé avant ce duel.',
    ['CULDCEPT', 'CARTE PRÉPARÉE'],
  )
  f.retreat('opponent', 20)
  f.hit('opponent', 'finisher')
  f.until(() => !f.state.opponent.attack)
  options.interlude?.(f, 'range')

  f.beat(
    'Une chaîne contre les balles.',
    'La chaîne divinatoire contrôle la ligne de tir. Holy Chain referme la blessure.',
    ['DOWSING CHAIN', 'HOLY CHAIN'],
  )
  f.ready('opponent')
  f.ready('player')
  f.retreat('player', 30)
  f.ranged('opponent')
  f.advance(20)
  f.hit('player', 'forwardSpecial')
  f.ready('player')
  f.hit('player', 'downSpecial')
  f.ready('player')

  f.beat(
    'Ko : engager toute la frappe.',
    'Les deux combattants cherchent l’impact critique, puis redistribuent leur aura.',
    ['KO', 'RYU', 'PUISSANCE'],
  )
  f.ko('player')
  f.held.opponent = { down: true, aura: true }
  f.held.player = { guard: true }
  for (let i = 0; f.state.opponent.aura < 25 && i < 8; i++) {
    f.close('opponent')
    f.hit('opponent', i % 2 ? 'standingHeavy' : 'forwardLight')
    f.ready('opponent')
  }
  f.held.player = {}
  f.held.opponent = {}
  f.ko('opponent')

  f.beat(
    'Benjamin libère On.',
    'Une poussée de puissance physique. Kurapika oppose le Ken au serment.',
    ['ON', 'KEN', 'VARIANTE DU JEU'],
  )
  f.ready('opponent')
  f.held.opponent = { aura: true, hatsu: true }
  f.advance(2)
  f.held.opponent = {}
  f.chain('opponent', ['lowLight', 'standingHeavy'])
  for (let i = 0; f.state.opponent.nen.on && i < 8; i++)
    f.guarded('opponent', i % 2 ? 'forwardHeavy' : 'standingHeavy')

  f.beat(
    'Kurapika répond par On.',
    'Benjamin doit à son tour encaisser et consumer la poussée adverse.',
    ['ON', 'KEN', 'CONTRE'],
  )
  f.ready('player')
  f.held.player = { aura: true, hatsu: true }
  f.advance(2)
  f.held.player = {}
  f.close('player')
  f.hit('player', 'standingLight')
  for (let i = 0; f.state.player.nen.on && i < 8; i++)
    f.guarded('player', i % 2 ? 'forwardHeavy' : 'standingHeavy')
  options.interlude?.(f, 'recovery')

  f.beat(
    'Reprendre le combat sans gaspiller l’aura.',
    'Les réserves se reforment pendant les déplacements, gardes et frappes physiques.',
    ['ZETSU', 'TEN', 'COMBO'],
  )
  f.held = { player: { down: true, aura: true }, opponent: { down: true, aura: true } }
  f.chain('player', ['standingLight', 'standingHeavy'])
  f.chain('opponent', ['lowLight', 'standingHeavy'])
  f.aerial('player')
  for (let i = 0; f.state.player.aura < 80 && i < 16; i++) {
    if (i < 2) {
      f.held.player = { down: true, guard: true }
      f.ready('opponent')
      f.ranged('opponent')
      f.advance(62)
    } else {
      f.held.player = { down: true, aura: true }
      f.held.opponent = { guard: true }
      f.close('player')
      f.hit('player', i % 2 ? 'standingHeavy' : 'forwardLight')
      f.ready('player')
    }
  }
  f.held = { player: {}, opponent: {} }

  f.beat('Emperor Time.', 'Les yeux écarlates s’allument. Kurapika reprend l’initiative.', [
    'EMPEROR TIME',
    'CHAÎNES',
  ])
  f.ready('player')
  f.advance()
  f.emperor()
  options.interlude?.(f, 'emperor')
  f.close('player')
  f.chain('player', ['standingLight', 'standingHeavy'])
  f.beat(
    'Steal Chain vide la réserve du prince.',
    'La seringue reste liée à Benjamin ; Stealth Dolphin reçoit le pouvoir dérobé.',
    ['STEAL CHAIN', 'STEALTH DOLPHIN'],
  )
  f.close('player')
  f.hit('player', 'backSpecial')
  f.held.player = { guard: true }
  f.until(() => Boolean(f.state.player.kurapika?.held), 240)
  f.held.player = {}
  f.hit('player', 'backSpecial')
  f.ready('player')
  if (f.state.player.kurapika?.held?.loaded)
    f.audit.push({ kind: 'stealth-dolphin-loaded', second: f.states.length / 60 })

  f.beat(
    'Judgment Chain : reste en Zetsu.',
    'La chaîne atteint le cœur. Benjamin tente de relever son Ren.',
    ['JUDGMENT CHAIN', 'EMPEROR TIME'],
  )
  f.close('player')
  f.hit('player', 'finisher')
  f.until(() => Boolean(f.state.opponent.judgmentChain))
  f.held.opponent = { aura: true }
  f.advance(2)
  f.held.opponent = {}
  f.caption('KURAPIKA · VICTOIRE', 'Emperor Time reste actif au verdict.', [
    'EMPEROR TIME',
    'SALLE DE BAL',
  ])
  f.advance(40)
  return f
}
