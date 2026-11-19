import { Shot } from '../fighting-chrollo-intro/reel'
import { performArsenalAction } from '../../src/lib/fighting/arsenalExecution'
import { performAuraAttack } from '../../src/lib/fighting/engine'
import type { FightSide } from '../../src/lib/fighting/types'

/**
 * The rest of Hisoka's Bungee Gum for the full presentation: catch and return, a ceiling
 * anchor that lifts him, the foot as a second origin, wounds sealed, gum on the heart,
 * a card rethrown, Texture Surprise exposed by a real hit, and his victory film.
 * Commands go through the production arsenal; nothing here edits combat state by hand.
 */
type Scene = () => Shot
type Command = Parameters<typeof performArsenalAction>[0]['command']
const shot = (...[stage, opponent, options = {}]: ConstructorParameters<typeof Shot>) =>
  new Shot(stage, opponent, { hero: 'hisoka', ...options })

/** Any arsenal command, either side, recorded on the current frame like `Shot.arsenal`. */
function act(s: Shot, command: Command, side: FightSide = 'player') {
  s.state = performArsenalAction({ state: s.state, side, command }, performAuraAttack)
  s.states[s.frame] = s.state
}
const until = (s: Shot, done: () => boolean, limit = 90) => {
  for (let i = 0; i < limit && !done(); i++) s.step()
}

/** Theta fires a real bullet; the gum on the palm stops it, then sends it back. */
const catchShot: Scene = () => {
  const s = shot('supreme-court', 'theta', { gap: 14 })
  s.step(6)
  act(s, { action: 'gum-catch' })
  s.beat('CATCH', 'Gum on the palm')
  s.ranged('opponent')
  until(s, () => Boolean(s.state.player.gumCatch?.projectile), 60)
  s.beat('CAUGHT', 'The bullet sticks')
  s.idle('opponent', 60)
  s.step(24)
  act(s, { action: 'gum-return' })
  s.beat('RETURN TO SENDER', '')
  s.hits(1, 'player', 50)
  s.step(30)
  return s
}

/** A ceiling anchor: the gum contracts and lifts him toward the lights, then lets go. */
const ceiling: Scene = () => {
  const s = shot('vip-casino', 'phinks', { gap: 5 })
  s.step(6)
  act(s, { action: 'gum-anchor', target: 'ceiling' })
  s.beat('CEILING', 'Gum on the beam above')
  s.step(22)
  act(s, { action: 'gum-propel' })
  s.beat('LIFT', 'The rubber pulls him up')
  s.step(30)
  act(s, { action: 'gum-detach' })
  until(s, () => s.state.player.y < 7, 60)
  s.press('heavy', { right: true })
  s.beat('DROP', 'Let go. Fall on him.')
  s.hits(1, 'player', 60)
  s.step(30)
  return s
}

/** Two origins: the hand on Kalluto, then the foot on the floor behind. */
const limbs: Scene = () => {
  const s = shot('banquet-hall', 'kalluto', { gap: 5 })
  s.step(6)
  s.move('neutralSpecial')
  until(s, () => Boolean(s.state.bungeeGum), 60)
  s.beat('HAND', 'First link')
  s.idle('player', 60)
  s.step(30)
  act(s, { action: 'gum-limb', target: 'foot-right' })
  act(s, { action: 'gum-anchor', target: 'floor-back' })
  s.beat('FOOT', 'Second link, from the shoe')
  s.step(30)
  act(s, { action: 'gum-select', target: '0' })
  s.step(2)
  act(s, { action: 'gum-recall' })
  s.beat('PICK ONE', 'And pull')
  s.step(50)
  return s
}

/** Leorio's thrown knife opens a real wound; the gum covers it and the heart. */
const repair: Scene = () => {
  const s = shot('heilly-hideout', 'leorio', { gap: 18 })
  s.step(6)
  act(s, { action: 'weapon-ready' }, 'opponent')
  s.step(14)
  act(s, { action: 'weapon-throw' }, 'opponent')
  until(s, () => (s.state.player.openWounds ?? 0) > 0, 60)
  s.step(30)
  act(s, { action: 'gum-seal' })
  s.beat('SEAL', 'Gum closes the cut. The wound stays.')
  s.step(40)
  act(s, { action: 'gum-heart' })
  s.beat('GUM ON THE HEART', 'It will restart it after death')
  s.step(46)
  return s
}

/** A linked card is thrown, reeled back in mid-air and thrown again: the same card. */
const card: Scene = () => {
  const s = shot('whale-hold', 'zakuro', { gap: 30 })
  s.step(6)
  act(s, { action: 'gum-prepare-throw' })
  s.step(15)
  s.ranged()
  s.beat('CARD ON A STRING', '')
  s.idle()
  s.step(2)
  act(s, { action: 'gum-recall' })
  s.beat('REELED IN', '')
  until(s, () => s.state.projectiles.some((p) => p.gumFlight?.mode === 'held'), 80)
  s.step(6)
  act(s, { action: 'gum-rethrow' })
  s.beat('RETHROWN', 'Same card, same gum')
  s.hits(1, 'player', 60)
  s.step(30)
  return s
}

/** Texture Surprise paints the cloth; the first real hit peels the mask away. */
const mask: Scene = () => {
  const s = shot('observation-deck', 'machi', { gap: 6 })
  s.step(6)
  s.move('downSpecial')
  s.beat('TEXTURE SURPRISE', 'Thin as paper. Fake as a card trick.')
  s.idle('player', 90)
  s.step(30)
  s.approach('opponent', 5)
  s.press('heavy', {}, 'opponent')
  s.beat('EXPOSED', 'One touch and the mask peels')
  s.hits(1, 'opponent', 60)
  s.step(40)
  return s
}

/** One last combo to the KO, then Hisoka's own victory film, ending on his face. */
const finale: Scene = () => {
  const s = shot('heavens-arena', 'kurapika', { gap: 5, opponentHealth: 40 })
  s.step(4)
  s.move('neutralSpecial')
  until(s, () => Boolean(s.state.bungeeGum), 60)
  s.beat('LOOK AT ME', '')
  s.idle()
  const down = () => {
    const o = s.state.opponent
    return o.knockdownFrames || o.hitStun || o.wakeupInvulnerableFrames
  }
  until(s, () => !down(), 120)
  s.approach('player', 5)
  for (let i = 0; i < 4 && s.state.phase !== 'finished'; i++) {
    s.press(i === 3 ? 'heavy' : 'light', i === 2 ? { right: true } : {})
    s.hits(1, 'player', 70)
    s.idle()
  }
  until(s, () => s.state.phase === 'finished', 120)
  s.cut('heavens-arena')
  s.film(0)
  s.step(60)
  s.film(8.2)
  s.step(108)
  return s
}

export const KIT_SCENES = { catchShot, ceiling, limbs, repair, card, mask, finale }
