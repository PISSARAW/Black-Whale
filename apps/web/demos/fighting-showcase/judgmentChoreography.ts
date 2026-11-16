import { JudgmentDirector } from './judgmentDirector'

export function createJudgmentShowcase() {
  const f = new JudgmentDirector()
  f.cut({
    player: 'mizaistom',
    opponent: 'biscuit',
    stageId: 'supreme-court',
    gap: 9,
    title: 'Mizaistom impose le premier échange.',
    subtitle: 'Biscuit reste sous sa petite apparence et lit le rythme adverse.',
    tags: ['TEN', 'INITIATIVE', 'COMBOS'],
  })
  for (const side of ['player', 'opponent'] as const)
    f.state[side] = { ...f.state[side], health: 750, maxHealth: 750 }
  f.advance(8)
  f.route('player')
  f.beat(
    'Biscuit déplace son aura. Mizaistom change de cible.',
    'Ryu renforce la tête ; la paume vise le corps. Ten stabilise la reprise.',
    ['RYU', 'TEN', 'CHANGEMENT DE NIVEAU'],
  )
  f.focus({ focusHead: true })
  f.route('player')
  f.focus({})
  f.route('opponent')
  f.close('player')
  f.until(() => f.free('player') && f.free('opponent'))
  f.move('opponent', 'standingHeavy')
  f.advance(2)
  f.execute('player', 'standingLight')
  f.execute('player', 'standingHeavy')
  f.airRoute('player')
  f.focus({ aura: true })
  f.route('opponent', true)
  f.focus({})
  f.route('player', true)
  f.route('player')

  f.beat(
    'Premier carton. L’ordre devient une arme.',
    'Biscuit avance après l’avertissement : Cross Game referme la prison.',
    ['CARTON JAUNE', 'DÉSOBÉISSANCE', 'CROSS GAME'],
  )
  f.warn()
  f.focus({ focusTorso: true })
  f.route('player')
  f.until(() => !f.state.opponent.crossGame)
  f.focus({})
  f.route('opponent')
  f.airRoute('player')
  f.route('player', true)
  f.route('opponent', true)
  f.route('player')
  f.route('player', true)

  f.beat(
    'Deuxième carton. Biscuit prépare la sortie.',
    'La contrainte immobilise son corps ; elle rassemble son aura et attend le dernier instant.',
    ['CROSS GAME', 'KEN', 'LECTURE DU TEMPO'],
  )
  f.warn()
  f.focus({ aura: true, guard: true })
  f.until(() => f.state.opponent.hatsuEffects.restrainedFrames <= 3)
  f.move('player', 'standingHeavy')
  f.advance(4)
  f.held.opponent = {}
  f.until(() => !f.state.opponent.crossGame)
  f.move('opponent', 'neutralSpecial')
  f.advance()
  f.beat(
    'Biscuit révèle son vrai corps.',
    'La sortie de prison devient une ouverture. La riposte interrompt l’attaque engagée.',
    ['VRAIE FORME', 'CONTRE', 'PUISSANCE'],
  )
  f.execute('opponent', 'standingLight')
  f.execute('opponent', 'standingHeavy')
  for (let i = 0; i < 3; i++) {
    f.route('opponent')
    f.route('player', i % 2 === 0)
    f.route('opponent', true)
  }
  f.beat(
    'Le maître reprend chaque ouverture.',
    'Approche aérienne, changement de niveau et frappes lourdes : Mizaistom doit répondre.',
    ['VRAIE FORME', 'COMBOS', 'PRESSION'],
  )
  f.airRoute('opponent')
  f.route('player')
  f.chain('opponent', ['standingLight', 'standingHeavy', 'forwardSpecial'])
  f.route('player', true)
  f.chain('opponent', ['standingLight', 'standingHeavy', 'forwardSpecial'])

  f.beat(
    'Biscuit explose en On.',
    'La colère nourrit les frappes physiques de son corps naturel.',
    ['ON', 'VRAIE FORME', 'VARIANTE DU JEU'],
  )
  f.swear('opponent')
  f.route('opponent')
  f.route('opponent', true)
  f.beat(
    'Deux serments. Aucun recul gratuit.',
    'Mizaistom répond par On. Chacun cherche l’ouverture dans la reprise adverse.',
    ['ON · MIZAISTOM', 'ON · BISCUIT', 'DUEL FINAL'],
  )
  f.swear('player')
  for (let i = 0; i < 8 && f.state.phase === 'fighting'; i++) {
    f.route('player')
    f.route('opponent')
  }
  f.caption('BISCUIT · VICTOIRE', 'La dernière conversion de sa vraie forme termine le duel.', [
    'ON',
    'VRAIE FORME',
    'K.-O.',
  ])
  f.advance(70)
  return f
}
