import { Shot } from '../fighting-chrollo-intro/reel'
import { split } from '../fighting-chrollo-intro/script'
import type { BuiltSegment } from '../fighting-chrollo-intro/hero'
import type { FightStageId } from '../../src/lib/fighting/stages'
import type { FighterId } from '../../src/lib/fighting/types'

type Options = ConstructorParameters<typeof Shot>[2]
const shot = (stage: FightStageId, opponent: FighterId, options: Options = {}) =>
  new Shot(stage, opponent, { hero: 'halkenburg', ...options })
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
  const s = shot('halkenburg-salon', 'benjamin', { gap: 10 })
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

/** In hides his aura; the blow arrives unannounced. */
const hidden: Scene = () => {
  const s = shot('princes-burial-chamber', 'illumi', { gap: 7 })
  s.step(4)
  s.held.player = { conceal: true }
  s.step(6)
  s.beat('IN', 'The aura turns invisible')
  s.approach('player', 5)
  s.press('heavy')
  s.hits(1, 'player', 60)
  s.held.player = {}
  s.step(40)
  return s
}

const COHORT = { resources: ['sedatives'], cohorts: ['player'] } as const

/** His marked, consenting followers: their shared will gathers behind the bow. */
const cohort: Scene = () => {
  const s = shot('halkenburg-salon', 'benjamin', { gap: 30, centre: 40, preparation: COHORT })
  s.step(6)
  s.beat('HIS COHORT', 'Marked. Consenting. Ready to die for him.')
  for (let i = 0; i < 520 && s.state.player.hatsuEffects.cohortWillFrames < 480; i++) s.step()
  s.beat('GATHERED WILL', 'Eight seconds of their will in one bow')
  s.step(12)
  s.cut('halkenburg-salon')
  s.arsenal({ action: 'halkenburg-transfer' })
  s.beat('TRANSFER', 'The will moves him into another body')
  s.step(70)
  return s
}

/** Mind-transfer mode: the arrow swaps minds; one of the pair can choose to sleep. */
const souls: Scene = () => {
  const s = shot('supreme-court', 'benjamin', { gap: 30, centre: 40, preparation: COHORT })
  s.arsenal({ action: 'halkenburg-mode', target: 'souls' })
  for (let i = 0; i < 520 && s.state.player.hatsuEffects.cohortWillFrames < 480; i++) s.step()
  s.cut('supreme-court')
  s.step(4)
  s.press('special')
  s.beat('WILL ARROW', 'A follower’s mind rides the arrow')
  for (let i = 0; i < 90 && !s.state.halkSoulLinks?.length; i++) s.step()
  s.beat('MIND TRANSFER', 'Two minds swap bodies')
  s.step(40)
  s.arsenal({ action: 'halkenburg-sedative' })
  s.beat('SEDATIVE', 'Sleep is already prepared for the way back')
  s.step(40)
  s.arsenal({ action: 'halkenburg-sleep' })
  s.beat('SLEEP', 'One mind yields. The other takes over.')
  s.step(40)
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
 * Signature combo, one continuous fight cut across stages: the cohort's will gathers,
 * J (Ryu) · J · →J, then the will arrow, filmed facing him. In the roster variant the
 * shot pierces Benjamin's guard and Halkenburg wakes up in another fighter's body.
 */
const signature: Scene = () => {
  const s = shot('halkenburg-salon', 'benjamin', { gap: 6, preparation: COHORT })
  s.beat('HIS COHORT', 'Their will gathers behind the bow')
  for (let i = 0; i < 520 && s.state.player.hatsuEffects.cohortWillFrames < 480; i++) s.step()
  s.cut('halkenburg-salon')
  s.beat('SIGNATURE COMBO', 'Will · J · J · →J · Arrow')
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
  s.idle()
  const free = () => {
    const o = s.state.opponent
    return !o.knockdownFrames && !o.hitStun && !o.wakeupInvulnerableFrames
  }
  for (let i = 0; i < 120 && !free(); i++) s.step()
  s.cut('heavens-arena')
  s.portrait('front', 50, -2)
  s.press('special')
  s.beat('WILL ARROW', 'It pierces every guard')
  const hero = s.state.player.id
  for (let i = 0; i < 120 && s.state.player.id === hero; i++) s.step()
  s.beat('A NEW BODY', 'The draw is random. The will is his.')
  s.step(80)
  return s
}

const SCENES: Array<[string, Scene]> = [
  ['face', face],
  ['aura', aura],
  ['combo', combo],
  ['projection', projection],
  ['hidden', hidden],
  ['cohort', cohort],
  ['souls', souls],
  ['vanish', vanish],
  ['sight', sight],
  ['defence', defence],
  ['reinforcement', reinforcement],
  ['oath', oath],
  ['signature', signature],
]

export function buildHalkenburgReel(): BuiltSegment[] {
  return SCENES.flatMap(([id, scene]) => {
    try {
      return split(id, scene().segment())
    } catch (error) {
      return [{ id, ...shot('heavens-arena', 'benjamin').segment((error as Error).message) }]
    }
  })
}
