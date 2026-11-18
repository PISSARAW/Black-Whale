import { Shot } from '../fighting-chrollo-intro/reel'
import { split } from '../fighting-chrollo-intro/script'
import type { BuiltSegment } from '../fighting-chrollo-intro/hero'
import type { FightStageId } from '../../src/lib/fighting/stages'
import type { FighterId } from '../../src/lib/fighting/types'

type Options = ConstructorParameters<typeof Shot>[2]
const shot = (stage: FightStageId, opponent: FighterId, options: Options = {}) =>
  new Shot(stage, opponent, { hero: 'kurapika', ...options })
type Scene = () => Shot

/** Damage that really lands, so Holy Chain and On have something to answer. */
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

const face: Scene = () => {
  const s = shot('banquet-hall', 'chrollo', { gap: 10 })
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

/** In hides the Dowsing Chain itself: the whip arrives unseen. */
const hidden: Scene = () => {
  const s = shot('princes-burial-chamber', 'illumi', { gap: 7 })
  s.step(4)
  s.held.player = { conceal: true }
  s.step(4)
  s.beat('IN', 'The chain turns invisible')
  s.approach('player', 5)
  s.move('forwardSpecial')
  s.hits(1, 'player', 70)
  s.held.player = {}
  s.beat('DOWSING CHAIN', 'The pendulum strikes')
  s.step(50)
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

/** Real wounds, Holy Chain closes them; Steal Chain then drains Hisoka's own Hatsu. */
const chains: Scene = () => {
  const s = shot('heilly-hideout', 'hisoka', { gap: 6, opponentAura: 24 })
  s.step(4)
  takeHits(s, () => s.state.player.health < s.state.player.maxHealth - 30, 2)
  for (let i = 0; i < 60 && (s.state.player.hitStun || s.state.player.attack); i++) s.step()
  s.step(4)
  s.move('downSpecial')
  s.beat('HOLY CHAIN', 'The thumb heals')
  s.idle('player', 90)
  s.step(10)
  s.approach('player', 6)
  s.move('backSpecial')
  s.beat('STEAL CHAIN', 'Drain the aura. Take the ability.')
  for (let i = 0; i < 160 && !s.state.player.kurapika?.held; i++) s.step()
  s.beat('STOLEN', 'Bungee Gum now belongs to Kurapika')
  s.step(30)
  return s
}

/** Emperor Time: the eyes turn scarlet, then Chain Jail binds a Spider. */
const emperor: Scene = () => {
  const s = shot('heavens-arena', 'chrollo', { gap: 6 })
  s.step(8)
  s.portrait('eyes', 64)
  s.press('finisher', { aura: true })
  s.beat('EMPEROR TIME', 'Scarlet eyes. Every chain, at full power.')
  s.step(64)
  s.move('neutralSpecial')
  s.beat('CHAIN JAIL', 'For the Spiders only')
  s.step(110, {}, { right: true, aura: true })
  return s
}

const oath: Scene = () => {
  const s = shot('whale-hold', 'hisoka', { gap: 6 })
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
 * Signature combo, one continuous fight cut across five stages: Emperor Time, J (Ryu),
 * J, →J (Dowsing Chain), then Judgment Chain to the heart, filmed facing Kurapika.
 */
const signature: Scene = () => {
  const s = shot('banquet-hall', 'chrollo', { gap: 6 })
  s.step(4)
  s.press('finisher', { aura: true })
  s.beat('SIGNATURE COMBO', 'Emperor Time · J · J · →J · Judgment')
  s.step(16)
  s.held.player = { focusHands: true }
  s.press('light')
  s.hits(1)
  s.cut('vip-casino')
  s.press('light')
  s.hits(1)
  s.cut('supreme-court')
  s.press('light', { right: true })
  s.hits(1, 'player', 90)
  s.held.player = {}
  s.beat('DOWSING CHAIN', 'J · J · →J')
  s.idle()
  s.step(4)
  s.cut('princes-burial-chamber')
  s.approach('player', 5)
  s.portrait('front', 64, -2)
  s.move('finisher')
  s.beat('JUDGMENT CHAIN', 'A blade around the heart')
  s.step(66)
  s.cut('heavens-arena')
  s.step(70)
  return s
}

const SCENES: Array<[string, Scene]> = [
  ['face', face],
  ['aura', aura],
  ['combo', combo],
  ['projection', projection],
  ['hidden', hidden],
  ['vanish', vanish],
  ['sight', sight],
  ['defence', defence],
  ['reinforcement', reinforcement],
  ['chains', chains],
  ['emperor', emperor],
  ['oath', oath],
  ['signature', signature],
]

export function buildKurapikaReel(): BuiltSegment[] {
  return SCENES.flatMap(([id, scene]) => {
    try {
      return split(id, scene().segment())
    } catch (error) {
      return [{ id, ...shot('heavens-arena', 'chrollo').segment((error as Error).message) }]
    }
  })
}
