import { Shot } from '../fighting-chrollo-intro/reel'
import { split } from '../fighting-chrollo-intro/script'
import type { BuiltSegment } from '../fighting-chrollo-intro/hero'
import type { FightStageId } from '../../src/lib/fighting/stages'
import type { FighterId } from '../../src/lib/fighting/types'

type Options = ConstructorParameters<typeof Shot>[2]
const shot = (stage: FightStageId, opponent: FighterId, options: Options = {}) =>
  new Shot(stage, opponent, { hero: 'feitan', ...options })
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
  const s = shot('heilly-hideout', 'hisoka', { gap: 10 })
  s.card = 'title'
  s.portrait('face', 84)
  s.step(84)
  return s
}

const aura: Scene = () => {
  const s = shot('heavens-arena', 'kurapika', { gap: 9 })
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

/** In hides the blade; the umbrella canopy hides the thrust that follows. */
const hidden: Scene = () => {
  const s = shot('princes-burial-chamber', 'illumi', { gap: 7 })
  s.step(4)
  s.arsenal({ action: 'umbrella-feint' })
  s.beat('UMBRELLA', 'The canopy hides everything behind it')
  s.step(18)
  s.held.player = { conceal: true }
  s.step(4)
  s.beat('IN', 'The aura turns invisible')
  s.approach('player', 5.5)
  s.move('forwardSpecial')
  s.beat('UMBRELLA THRUST', 'The blade was in the handle')
  s.hits(1, 'player', 60)
  s.held.player = {}
  s.step(40)
  return s
}

/** Double tap: the engine's own dash, a real physical burst subject to collisions. */
function dash(s: Shot, direction: 'right' | 'left') {
  s.step(2, { [direction]: true })
  s.step(2)
  s.step(12, { [direction]: true })
}

/** Knocked down or rising: a hit there is avoided, so the next strike waits. */
const wakingUp = (s: Shot) =>
  s.state.opponent.knockdownFrames > 0 || (s.state.opponent.wakeupInvulnerableFrames ?? 0) > 0

/** The sword lives in the umbrella: dash in, low cut, retreating slash, overhead. */
const blade: Scene = () => {
  const s = shot('whale-hold', 'leorio', { gap: 22 })
  s.step(6)
  s.beat('DASH', 'Low and fast')
  dash(s, 'right')
  s.approach('player', 6)
  s.move('downSpecial')
  s.beat('LOW CUT', '↓ Special')
  s.hits(1, 'player', 50)
  s.idle()
  s.move('backSpecial')
  s.beat('RETREAT SLASH', '← Special. Cut, then gone.')
  s.hits(1, 'player', 50)
  s.idle()
  for (let i = 0; i < 90 && wakingUp(s); i++) s.step()
  s.approach('player', 4.5)
  s.move('forwardHeavy')
  s.beat('OVERHEAD', '→ Heavy')
  s.hits(1, 'player', 60)
  s.step(30)
  return s
}

/** He jumps over, strikes from the air, lands low and sweeps. */
const agility: Scene = () => {
  const s = shot('banquet-hall', 'kalluto', { gap: 9 })
  s.step(6)
  s.approach('player', 5)
  s.step(4, { jump: true })
  s.step(6)
  s.beat('AIR', 'Above the guard')
  s.press('heavy', { right: true })
  s.hits(1, 'player', 60)
  for (let i = 0; i < 60 && s.state.player.y > 0; i++) s.step(1, { down: true })
  for (let i = 0; i < 90 && wakingUp(s); i++) s.step(1, { down: true })
  s.approach('player', 6)
  s.held.player = { down: true }
  s.press('heavy', { down: true })
  s.beat('SWEEP', 'Then under it')
  s.hits(1, 'player', 60)
  s.held.player = {}
  s.idle()
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
  const s = shot('heilly-hideout', 'phinks', { gap: 6 })
  s.step(4)
  takeHits(s, () => (s.state.player.on?.grudge ?? 0) >= 52)
  s.step(8)
  s.portrait('face', 62)
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
 * Signature combo, one continuous fight cut across stages: Feitan takes real wounds first,
 * answers with J (Ryu) · J · →J (umbrella thrust), then packs the pain into armour
 * (filmed facing him) and lights Rising Sun.
 */
const signature: Scene = () => {
  const s = shot('heilly-hideout', 'hisoka', { gap: 6 })
  s.step(4)
  takeHits(s, () => s.state.player.health < s.state.player.maxHealth - 40, 3)
  s.beat('SIGNATURE COMBO', 'Hurt him. That is the mistake.')
  for (let i = 0; i < 90 && (s.state.player.hitStun || s.state.player.knockdownFrames); i++)
    s.step()
  s.approach('player', 5)
  s.held.player = { focusHands: true }
  s.cut('banquet-hall')
  s.press('light')
  s.hits(1)
  s.cut('vip-casino')
  s.press('light')
  s.hits(1)
  s.press('light', { right: true })
  s.hits(1, 'player', 90)
  s.held.player = {}
  s.beat('UMBRELLA THRUST', 'J · J · →J')
  s.idle()
  s.step(4)
  s.cut('observation-deck')
  s.portrait('front', 80, -2)
  s.press('special')
  s.beat('PAIN PACKER', 'Every wound becomes armour')
  s.idle('player', 90)
  s.step(6)
  s.cut('heavens-arena')
  s.press('finisher')
  s.beat('RISING SUN', 'Pay the pain back. All of it.')
  s.step(150)
  return s
}

const SCENES: Array<[string, Scene]> = [
  ['face', face],
  ['aura', aura],
  ['combo', combo],
  ['projection', projection],
  ['blade', blade],
  ['agility', agility],
  ['hidden', hidden],
  ['vanish', vanish],
  ['sight', sight],
  ['defence', defence],
  ['reinforcement', reinforcement],
  ['oath', oath],
  ['signature', signature],
]

export function buildFeitanReel(): BuiltSegment[] {
  return SCENES.flatMap(([id, scene]) => {
    try {
      return split(id, scene().segment())
    } catch (error) {
      return [{ id, ...shot('heavens-arena', 'hisoka').segment((error as Error).message) }]
    }
  })
}
