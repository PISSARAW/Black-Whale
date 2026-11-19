import { Shot } from '../fighting-chrollo-intro/reel'
import { split } from '../fighting-chrollo-intro/script'
import type { BuiltSegment } from '../fighting-chrollo-intro/hero'
import { KIT_SCENES as kit } from './hisokaKit'
import type { FightStageId } from '../../src/lib/fighting/stages'
import type { FighterId } from '../../src/lib/fighting/types'

type Options = ConstructorParameters<typeof Shot>[2]
const shot = (stage: FightStageId, opponent: FighterId, options: Options = {}) =>
  new Shot(stage, opponent, { hero: 'hisoka', ...options })
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

const face: Scene = () => {
  const s = shot('heavens-arena', 'chrollo', { gap: 10 })
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

/** In hides the gum itself: Bungee Gum attaches unseen, stretches, then reels Illumi in. */
const hidden: Scene = () => {
  const s = shot('princes-burial-chamber', 'illumi', { gap: 6 })
  s.step(4)
  s.held.player = { conceal: true }
  s.step(6)
  s.beat('IN', 'The gum turns invisible')
  s.approach('player', 5)
  s.move('neutralSpecial')
  for (let i = 0; i < 60 && !s.state.bungeeGum; i++) s.step()
  s.beat('BUNGEE GUM', 'Rubber and gum. Attached.')
  s.held.player = {}
  s.idle('player', 60)
  s.step(20, { left: true })
  s.step(4)
  s.move('forwardSpecial')
  s.beat('RECALL', 'It always snaps back')
  s.step(50)
  return s
}

/**
 * Bungee Gum on scenery: it sticks to a real crate of the casino, pulls the crate back to
 * Hisoka, then a linked card flies out and is reeled in on its own gum.
 */
const objects: Scene = () => {
  const s = shot('vip-casino', 'chrollo', { gap: 26, centre: 33, arena: true })
  s.step(6)
  const crate = s.state.battlefield?.entities.find((e) => e.kind === 'crate')
  if (!crate) throw new Error('no crate on the stage')
  s.arsenal({ action: 'gum-object', target: crate.id })
  s.beat('ANY OBJECT', 'The gum sticks to a crate')
  s.step(24)
  s.arsenal({ action: 'gum-recall' })
  s.beat('RECALL', 'And the crate comes back')
  s.step(40)
  s.arsenal({ action: 'gum-detach' })
  s.step(6)
  s.arsenal({ action: 'gum-prepare-throw' })
  s.step(15)
  s.ranged()
  s.beat('CARD ON A STRING', 'Thrown, then reeled in')
  s.step(30)
  s.arsenal({ action: 'gum-recall' })
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
  const s = shot('screening-room', 'kurapika', { gap: 8 })
  s.step(6)
  s.held.opponent = { conceal: true }
  s.held.player = { gyo: true }
  s.step(4)
  s.beat('GYO', 'Aura in the eyes. Nothing stays hidden.')
  s.move('forwardSpecial', { conceal: true }, 'opponent')
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
  s.beat('SHU', 'Aura turns a card into a blade')
  s.ranged()
  s.step(40)
  s.ranged()
  s.step(44)
  s.held.player = {}
  return s
}

const oath: Scene = () => {
  const s = shot('heilly-hideout', 'phinks', { gap: 6 })
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
 * Signature combo, one continuous fight cut across stages: Bungee Gum sticks on the first
 * contact, J (Ryu) · J keep Chrollo close, and →J becomes the Elastic Execution, filmed
 * facing Hisoka.
 */
const signature: Scene = () => {
  const s = shot('heavens-arena', 'chrollo', { gap: 5 })
  s.step(4)
  s.move('neutralSpecial')
  for (let i = 0; i < 60 && !s.state.bungeeGum; i++) s.step()
  s.beat('SIGNATURE COMBO', 'Gum · J · J · →J')
  s.idle('player', 60)
  // The gum's contact knocks Chrollo down: the chain starts once he is back up.
  const down = () => {
    const o = s.state.opponent
    return o.knockdownFrames || o.hitStun || o.wakeupInvulnerableFrames || o.pose !== 'idle'
  }
  for (let i = 0; i < 120 && down(); i++) s.step()
  s.approach('player', 5)
  s.held.player = { focusHands: true }
  s.cut('vip-casino')
  s.press('light')
  s.hits(1)
  s.cut('supreme-court')
  s.press('light')
  s.hits(1)
  s.held.player = {}
  s.cut('banquet-hall')
  s.portrait('quarter', 60, -2)
  s.press('light', { right: true })
  s.beat('ELASTIC EXECUTION', 'The gum pulls. The blow lands.')
  s.hits(1, 'player', 90)
  s.step(30)
  s.cut('heavens-arena')
  s.step(60)
  return s
}

const SCENES: Array<[string, Scene]> = [
  ['face', face],
  ['aura', aura],
  ['combo', combo],
  ['projection', projection],
  ['hidden', hidden],
  ['limbs', kit.limbs],
  ['objects', objects],
  ['card', kit.card],
  ['ceiling', kit.ceiling],
  ['catch', kit.catchShot],
  ['repair', kit.repair],
  ['mask', kit.mask],
  ['vanish', vanish],
  ['sight', sight],
  ['defence', defence],
  ['reinforcement', reinforcement],
  ['oath', oath],
  ['signature', signature],
  ['finale', kit.finale],
]

export function buildHisokaReel(): BuiltSegment[] {
  return SCENES.flatMap(([id, scene]) => {
    try {
      return split(id, scene().segment())
    } catch (error) {
      return [{ id, ...shot('heavens-arena', 'chrollo').segment((error as Error).message) }]
    }
  })
}
