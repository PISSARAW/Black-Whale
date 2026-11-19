import type { LastContactDirector } from './lastContactDirector'

export function lastContactRoom(f: LastContactDirector) {
  f.mark('Une page, une prison', 'Les mains libres changent les règles du contact.', [
    'DOUBLE FACE',
    'FUN FUN CLOTH',
  ])
  f.recover('opponent', 78)
  f.close('opponent')
  f.page('fun-fun-cloth')
  f.poseBook()
  f.command('opponent', { action: 'history-use', target: 'player' })
  f.advance(23)
  if (!f.state.player.clothCapture) throw Error('Cloth capture interrupted')
  f.advance(18)
  f.command('opponent', { action: 'history-release' })
  f.ready('player')
  f.poseBook()
  f.travelToRoom()
  f.page('indoor-fish')
  f.command('opponent', { action: 'history-use' })
  f.mark('La chambre close', 'Les blessures attendent que les poissons disparaissent.', [
    'INDOOR FISH',
  ])
  f.held.player = { guard: true }
  f.advance(65)
  f.held.player = {}
  f.physical('player', 2)
  f.physical('opponent', 0)
  f.page('chrollo-teleportation')
  f.command('opponent', { action: 'history-use', target: 'point:55' })
  f.held.opponent = { left: true }
  f.held.player = { right: true, down: true, aura: true }
  f.advance(40)
  f.held = { player: {}, opponent: {} }
  f.exchange(6)
}

export function lastContactTheft(f: LastContactDirector) {
  f.mark('Un marché au milieu des coups', 'Hisoka offre une surface. Il conserve son vrai lien.', [
    'TEXTURE SURPRISE',
    'SKILL HUNTER',
  ])
  f.recover('player', 70)
  f.hit('player', 'downSpecial')
  f.ready('player')
  f.close('opponent')
  f.ready('opponent')
  f.command('opponent', { action: 'hunter-ask' })
  f.advance(35)
  f.command('player', { action: 'hunter-answer' })
  f.advance(35)
  f.command('player', { action: 'hunter-palm' })
  if (f.state.player.skillHunterStolen?.[0]?.moveId !== 'hisoka:downSpecial')
    throw Error(
      'Wrong ability stolen ' +
        JSON.stringify({
          stolen: f.state.player.skillHunterStolen,
          witness: f.state.opponent.hatsuEffects,
          moves: f.audit.slice(-20),
        }),
    )
  f.physical('player', 1)
  f.hit('opponent', 'neutralSpecial')
  f.ready('opponent')
  f.exchange(5)
}

export function lastContactControl(f: LastContactDirector) {
  f.mark('Un pas qui ne lui appartient plus', 'L’antenne achète quelques secondes.', [
    'BLACK VOICE',
  ])
  f.recover('opponent', 65)
  f.page('black-voice')
  f.close('opponent')
  f.hit('opponent', 'neutralSpecial')
  f.physical('opponent', 1)
  f.ready('player')
  f.held.player = { down: true, aura: true }
  f.retreat('player', 35)
  f.page('love-dial-6700')
  f.command('opponent', { action: 'history-phone-criteria', target: 'ability:hisoka' })
  f.command('opponent', { action: 'history-phone-call' })
  f.held.player = {}
  f.mark('Retour à l’envoyeur', 'Le même objet, une autre trajectoire.', ['BUNGEE GUM', 'CONTRE'])
  f.recover('player', 50)
  f.ready('opponent')
  f.close('player', 12)
  f.retreat('player', 16)
  f.ready('player')
  f.ready('opponent')
  f.projectile('opponent')
  f.advance(8)
  f.command('player', { action: 'gum-catch' })
  f.advance(35)
  if (!f.state.player.gumCatch?.projectile) throw Error('Physical object not caught')
  f.command('player', { action: 'gum-return' })
  f.advance(32)
  f.exchange(6)
}
