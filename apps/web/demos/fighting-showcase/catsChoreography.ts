import { CatsDirector } from './catsDirector'
import { catsNamePhase } from '../../src/lib/fighting/camillaCat'

export function createCatsShowcase() {
  const f = new CatsDirector()
  f.cut({
    player: 'chrollo',
    opponent: 'camilla',
    stageId: 'camilla-salon',
    gap: 9,
    title: 'Chrollo prend immédiatement le contrôle.',
    subtitle: 'Pression haute, changements de niveau : Camilla subit le rythme.',
    tags: ['CHROLLO', 'PRESSION', 'COMBOS'],
  })
  for (const side of ['player', 'opponent'] as const)
    f.state[side] = { ...f.state[side], health: 500, maxHealth: 500 }
  f.advance(6)
  for (let i = 0; i < 40 && !f.state.catsName && f.state.phase === 'fighting'; i++) {
    if (i === 4) {
      f.caption(
        'Camilla trouve une ouverture.',
        'Deux frappes passent. Chrollo reprend aussitôt la pression.',
        ['RIPOSTE', 'CORPS-À-CORPS'],
      )
      f.chain('opponent', ['standingLight', 'backHeavy'])
    }
    if (i === 12) {
      f.caption(
        'Une riposte isolée ne suffit pas.',
        'Chrollo ferme la distance et convertit chaque contact.',
        ['CAMILLA', 'RIPOSTE', 'DOMINATION'],
      )
      f.chain('opponent', ['lowLight'])
    }
    if ([2, 8, 16].includes(i)) {
      f.caption(
        'Aucune place pour reprendre son souffle.',
        'Le livre accompagne la conversion. Chrollo relance au plus près.',
        ['SKILL HUNTER', 'SUN AND MOON', 'COMBOS'],
      )
      f.chain('player', ['standingLight', 'backHeavy'])
      f.close('player', 4.5)
      f.until(() => f.free('player') && f.free('opponent'))
      f.execute('player', 'neutralSpecial')
    } else if ([6, 14].includes(i)) {
      f.caption(
        'Chrollo varie les angles.',
        'Approche aérienne, réception et reprise immédiate au sol.',
        ['COMBO AÉRIEN', 'PRESSION'],
      )
      f.aerial('player')
    } else f.route(i % 2 === 0)
    if (i === 17)
      f.caption(
        'Chrollo croit terminer le combat.',
        'Camilla ne peut plus suivre les enchaînements.',
        ['DERNIÈRE RAFALE', 'K.-O. IMMINENT'],
      )
  }
  const captions = {
    summon: [
      'Camilla est morte. Son Nen se réveille.',
      'Cat’s Name apparaît derrière son meurtrier.',
    ],
    capture: ['La bête saisit Chrollo.', 'Ses pattes se referment : la domination change de camp.'],
    absorb: ['Cat’s Name écrase son meurtrier.', 'La bête absorbe la vie de Chrollo.'],
    revive: [
      'La vie volée revient à Camilla.',
      'Le meurtrier disparaît ; la princesse ressuscite.',
    ],
  }
  while (f.state.catsName) {
    const [title, subtitle] = captions[catsNamePhase(f.state.catsName.frame)]
    f.caption(title, subtitle, ['CAT’S NAME', 'NEN POST MORTEM'])
    f.advance()
  }
  f.caption('CAMILLA · VICTOIRE', 'Trente secondes de domination. Une mort qui renverse tout.', [
    'RÉSURRECTION',
    'CAT’S NAME',
    'VICTOIRE',
  ])
  f.advance(80)
  return f
}
