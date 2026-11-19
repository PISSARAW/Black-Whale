import { Shot } from '../fighting-chrollo-intro/reel'
import { split } from '../fighting-chrollo-intro/script'
import type { BuiltSegment } from '../fighting-chrollo-intro/hero'
import { KIT_SCENES as kit } from './benjaminKit'
import type { FightStageId } from '../../src/lib/fighting/stages'
import type { FighterId } from '../../src/lib/fighting/types'

type Options = ConstructorParameters<typeof Shot>[2]
const shot = (stage: FightStageId, opponent: FighterId, options: Options = {}) =>
  new Shot(stage, opponent, { hero: 'benjamin', ...options })
type Scene = () => Shot

function takeHits(s: Shot, until: () => boolean, rounds = 5) {
  for (let round = 0; round < rounds && !until(); round++) {
    s.approach('opponent', 4)
    s.press('light', {}, 'opponent')
    s.hits(1, 'opponent', 50)
    s.press('heavy', {}, 'opponent')
    s.hits(1, 'opponent', 60)
    s.step(20)
  }
}

/** H returns the card as soon as Benjamin is free to act (stray bullets may still stun him). */
function returnCard(s: Shot) {
  for (let i = 0; i < 120 && s.state.player.hatsuEffects.baton?.card; i++) {
    const p = s.state.player
    if (!p.attack && !p.hitStun && !p.blockStun && !p.knockdownFrames) s.press('finisher')
    if (!s.state.player.hatsuEffects.baton?.card) break
    s.step()
  }
}

const face: Scene = () => {
  const s = shot('benjamin-salon', 'franklin', { gap: 10 })
  s.card = 'title'
  s.portrait('face', 84)
  s.step(84)
  return s
}

const aura: Scene = () => {
  const s = shot('heavens-arena', 'feitan', { gap: 9 })
  s.step(8)
  s.beat('TEN', 'Aura held close to the body')
  s.step(30)
  s.held.player = { aura: true }
  s.step(4)
  s.beat('REN', 'Aura unleashed')
  s.step(32)
  s.held.player = {}
  s.approach('player', 5)
  s.press('heavy', { aura: true })
  s.beat('KO', 'All of it in one fist')
  s.hits(1)
  s.step(28)
  return s
}

const combo: Scene = () => {
  const s = shot('banquet-hall', 'phinks', { gap: 6 })
  s.step(8)
  s.held.player = { focusHands: true }
  s.beat('RYU', 'Aura flows into the striking limb')
  s.press('light')
  s.hits(1)
  s.press('light')
  s.hits(1)
  s.press('light', { jump: true })
  s.hits(1)
  s.held.player = {}
  s.beat('LAUNCH', 'J · J · ↑J')
  for (let d = 0; d < 30; d += 2) {
    const before = s.state.player.attack
    s.press('light', { aura: true })
    if (s.state.player.attack && s.state.player.attack !== before) break
    s.step(2)
  }
  s.beat('KO JUGGLE', 'Caught in the air')
  s.hits(1, 'player', 60)
  s.step(36)
  return s
}

const projection: Scene = () => {
  const s = shot('vip-casino', 'franklin', { gap: 10 })
  s.step(6)
  s.approach('player', 3.5)
  s.beat('THROW', 'Grab. Slam.')
  s.press('throw')
  s.hits(1, 'player', 80)
  s.step(46)
  return s
}

/** Secret Window marks on contact, In keeps it unseen; Air Blow follows from the left palm. */
const hidden: Scene = () => {
  const s = shot('princes-burial-chamber', 'illumi', { gap: 6 })
  s.step(4)
  s.held.player = { conceal: true }
  s.step(6)
  s.beat('IN', 'The aura turns invisible')
  s.approach('player', 5)
  s.press('special', { right: true })
  s.beat('SECRET WINDOW', 'A hidden mark on the target')
  s.idle('player', 60)
  s.held.player = {}
  s.step(6)
  s.press('special')
  s.beat('AIR BLOW', 'A blast from the left palm')
  s.hits(1, 'player', 60)
  s.step(36)
  return s
}

/** Culdcept turns a real incoming Nen bullet into a card, then fires it back. */
const culdcept: Scene = () => {
  const s = shot('vip-casino', 'franklin', { gap: 20 })
  s.step(6)
  s.press('special', { down: true })
  s.beat('CULDCEPT', 'Catch the Nen')
  s.step(10)
  s.ranged('opponent')
  for (let i = 0; i < 80 && !s.state.player.hatsuEffects.baton?.card; i++) s.step()
  s.beat('CARD', 'The bullet becomes a card')
  returnCard(s)
  s.beat('RETURN', 'Back to the sender')
  s.hits(1, 'player', 90)
  s.step(30)
  return s
}

const vanish: Scene = () => {
  const s = shot('observation-deck', 'machi', { gap: 12 })
  s.step(6)
  s.held.player = { down: true, aura: true }
  s.step(4)
  s.beat('ZETSU', 'No aura. Gone.')
  s.step(56)
  s.held.player = {}
  s.step(8)
  return s
}

const sight: Scene = () => {
  const s = shot('screening-room', 'hisoka', { gap: 8 })
  s.step(6)
  s.held.opponent = { conceal: true }
  s.held.player = { gyo: true }
  s.step(4)
  s.beat('GYO', 'Aura in the eyes. Nothing stays hidden.')
  s.move('neutralSpecial', { conceal: true }, 'opponent')
  s.step(58)
  s.held = { player: {}, opponent: {} }
  s.step(10)
  return s
}

/** Back to the wall: the wall absorbs the block pushback, so the guard holds in place. */
const defence: Scene = () => {
  const s = shot('supreme-court', 'benjamin', { gap: 6, centre: 10 })
  s.step(6)
  s.held.player = { guard: true, aura: true }
  s.step(6)
  s.pressure(4, (n) =>
    n === 1 ? s.beat('KEN', 'Ten and Ren at once. Every hit stopped.') : s.beat(`BLOCK ×${n}`),
  )
  s.held.player = {}
  s.step(10)
  return s
}

const reinforcement: Scene = () => {
  const s = shot('whale-hold', 'zakuro', { gap: 18 })
  s.step(6)
  s.held.player = { shu: true }
  s.step(8)
  s.beat('SHU', 'Aura wraps the weapon')
  s.ranged()
  s.step(40)
  s.ranged()
  s.step(44)
  s.held.player = {}
  return s
}

const oath: Scene = () => {
  const s = shot('heilly-hideout', 'hisoka', { gap: 6 })
  s.step(4)
  takeHits(s, () => (s.state.player.on?.grudge ?? 0) >= 52)
  s.step(8)
  s.portrait('eyes', 62)
  s.held.player = { aura: true, hatsu: true }
  s.step(3)
  s.held.player = {}
  s.beat('ON', 'Grudge becomes power')
  s.step(59)
  s.approach('player', 5)
  s.press('light')
  s.hits(1)
  s.press('heavy')
  s.hits(1)
  s.step(40)
  return s
}

/**
 * Signature combo, one continuous fight cut across stages: J (Ryu) · J · →J ends on Air
 * Blow; Franklin answers with a Nen burst, Culdcept catches it facing camera and Benjamin
 * fires the card straight back.
 */
const signature: Scene = () => {
  const s = shot('benjamin-salon', 'franklin', { gap: 6 })
  s.step(6)
  s.held.player = { focusHands: true }
  s.beat('SIGNATURE COMBO', 'J · J · →J · Culdcept · H')
  s.press('light')
  s.hits(1)
  s.cut('banquet-hall')
  s.press('light')
  s.hits(1)
  s.cut('supreme-court')
  s.press('light', { right: true })
  s.hits(1, 'player', 90)
  s.held.player = {}
  s.beat('AIR BLOW', 'J · J · →J')
  s.idle()
  for (let i = 0; i < 90 && (s.state.opponent.hitStun || s.state.opponent.knockdownFrames); i++)
    s.step()
  s.cut('benjamin-salon')
  s.portrait('front', 70, -2)
  s.press('special', { down: true })
  s.beat('CULDCEPT', 'Every Nen attack is his')
  s.step(10)
  s.ranged('opponent')
  for (let i = 0; i < 80 && !s.state.player.hatsuEffects.baton?.card; i++) s.step()
  s.step(6)
  s.cut('heavens-arena')
  returnCard(s)
  s.beat('RETURN TO SENDER', 'The card fires back')
  s.hits(1, 'player', 90)
  s.step(50)
  return s
}

const SCENES: Array<[string, Scene]> = [
  ['face', face],
  ['aura', aura],
  ['combo', combo],
  ['projection', projection],
  ['hidden', hidden],
  ['culdcept', culdcept],
  ['vanish', vanish],
  ['sight', sight],
  ['defence', defence],
  ['reinforcement', reinforcement],
  ['oath', oath],
  ['signature', signature],
  ['guardian', kit.guardian],
]

export function buildBenjaminReel(): BuiltSegment[] {
  return SCENES.flatMap(([id, scene]) => {
    try {
      return split(id, scene().segment())
    } catch (error) {
      return [{ id, ...shot('heavens-arena', 'franklin').segment((error as Error).message) }]
    }
  })
}
