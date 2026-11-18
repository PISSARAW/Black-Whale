import { Shot, type Segment } from './reel'
import type { BuiltSegment } from './hero'

type Scene = () => Shot

/** Opening portrait: his face, before anything happens. */
const face: Scene = () => {
  const s = new Shot('heavens-arena', 'hisoka', { gap: 10 })
  s.card = 'title'
  s.portrait('face', 84)
  s.step(84)
  return s
}

/** Ten, Ren, then Ko on a heavy: the three states of the aura in one shot. */
const aura: Scene = () => {
  const s = new Shot('heavens-arena', 'hisoka', { gap: 9 })
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

/** The J chain with Ryu on the striking limb, an air finish and a Ko juggle. */
const combo: Scene = () => {
  const s = new Shot('banquet-hall', 'feitan', { gap: 6 })
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
  const s = new Shot('vip-casino', 'benjamin', { gap: 10 })
  s.step(6)
  s.approach('player', 3.5)
  s.beat('THROW', 'Grab. Slam.')
  s.press('throw')
  s.hits(1, 'player', 80)
  s.step(46)
  return s
}

/** Second page of the book, cast under In: Black Voice cannot be seen coming. */
const voice: Scene = () => {
  const s = new Shot('princes-burial-chamber', 'illumi', { gap: 7 })
  s.step(4)
  s.move('backSpecial')
  s.beat('BANDIT’S SECRET', 'Turn the page')
  s.idle()
  s.held.player = { conceal: true }
  s.step(4)
  s.beat('IN', 'The Hatsu turns invisible')
  s.approach('player', 5)
  s.move('neutralSpecial')
  s.hits(1, 'player', 70)
  s.held.player = {}
  s.beat('BLACK VOICE', 'The antenna gives the orders')
  s.step(66)
  return s
}

/** Zetsu hides the aura entirely; the engine keeps the book shut while it lasts. */
const vanish: Scene = () => {
  const s = new Shot('observation-deck', 'kurapika', { gap: 12, bookClosed: true })
  s.step(6)
  s.held.player = { down: true, aura: true }
  s.step(4)
  s.beat('ZETSU', 'No aura. Gone.')
  s.step(56)
  s.held.player = {}
  s.step(8)
  return s
}

/** Hisoka hides Bungee Gum with In; Chrollo's Gyo reads it. */
const sight: Scene = () => {
  const s = new Shot('screening-room', 'hisoka', { gap: 8 })
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
  const s = new Shot('supreme-court', 'phinks', { gap: 6, centre: 10 })
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
  const s = new Shot('whale-hold', 'zakuro', { gap: 18 })
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

/** Historical pages, opened through the arsenal like the retrospective mode. */
const pages: Scene = () => {
  const s = new Shot('heilly-hideout', 'hisoka', { gap: 5, centre: 20.5, preparation: true })
  s.step(4)
  s.arsenal({ action: 'history-page', target: 'indoor-fish' })
  s.step(14)
  s.arsenal({ action: 'history-use' })
  s.beat('INDOOR FISH', 'A stolen page. Fish made of Nen.')
  s.step(62)
  s.arsenal({ action: 'history-page', target: 'chrollo-teleportation' })
  s.step(14)
  s.arsenal({ action: 'history-use', target: 'point:78' })
  s.beat('TELEPORT', 'Another page, another victim')
  s.step(44)
  return s
}

/** Chrollo takes real damage, swears the On (eyes in close-up), then hits with it. */
const oath: Scene = () => {
  const s = new Shot('whale-hold', 'hisoka', { gap: 6, bookClosed: true })
  s.step(4)
  for (let round = 0; round < 5 && (s.state.player.on?.grudge ?? 0) < 52; round++) {
    s.approach('opponent', 4)
    s.press('light', {}, 'opponent')
    s.hits(1, 'opponent', 50)
    s.press('heavy', {}, 'opponent')
    s.hits(1, 'opponent', 60)
    s.step(20)
  }
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
 * The signature combo, one continuous fight cut across five stages:
 * J (Ryu) → J → →J lands the Sun, the book closes facing camera, the Moon detonates.
 */
const signature: Scene = () => {
  const s = new Shot('banquet-hall', 'hisoka', { gap: 6 })
  s.step(6)
  s.held.player = { focusHands: true }
  s.beat('SIGNATURE COMBO', 'J · J · →J · close · Moon')
  s.press('light')
  s.hits(1)
  s.cut('vip-casino')
  s.press('light')
  s.hits(1)
  s.cut('supreme-court')
  s.press('light', { right: true })
  s.hits(1, 'player', 90)
  s.held.player = {}
  s.beat('SUN', 'The mark is set')
  s.idle()
  s.step(6)
  s.cut('princes-burial-chamber')
  s.portrait('front', 46, -2)
  s.move('downSpecial')
  s.beat('', 'He closes the book')
  s.step(44)
  s.cut('heavens-arena')
  s.approach('player', 4.5)
  s.move('finisher')
  s.beat('MOON', 'Sun and Moon. Boom.')
  s.hits(1, 'player', 80)
  s.step(60)
  return s
}

export const SCENES: Array<[string, Scene]> = [
  ['face', face],
  ['aura', aura],
  ['combo', combo],
  ['projection', projection],
  ['voice', voice],
  ['vanish', vanish],
  ['sight', sight],
  ['defence', defence],
  ['reinforcement', reinforcement],
  ['pages', pages],
  ['oath', oath],
  ['signature', signature],
]

type Built = BuiltSegment

/** A shot cut across stages becomes consecutive segments sharing one continuous fight. */
export function split(id: string, whole: Segment): Built[] {
  const bounds = [0, ...whole.splits.map((c) => c.at), whole.states.length - 1]
  const stages = [whole.stage, ...whole.splits.map((c) => c.stage)]
  return stages.map((stage, i) => {
    const [from, to] = [bounds[i], bounds[i + 1]]
    const inside = <T extends { at: number }>(list: T[]) =>
      list.filter((e) => e.at >= from && e.at < to).map((e) => ({ ...e, at: e.at - from }))
    return {
      ...whole,
      id: whole.splits.length ? `${id}-${i + 1}` : id,
      stage,
      states: whole.states.slice(from, to + 1),
      beats: inside(whole.beats),
      impacts: inside(whole.impacts),
      portraits: whole.portraits
        .filter((p) => p.to > from && p.from < to)
        .map((p) => ({ ...p, from: p.from - from, to: p.to - from })),
      splits: [],
      part: whole.splits.length > 0,
      card: i === 0 ? whole.card : undefined,
    }
  })
}

export function buildReel(): Built[] {
  return SCENES.flatMap(([id, scene]) => {
    try {
      return split(id, scene().segment())
    } catch (error) {
      return [{ id, ...new Shot('heavens-arena', 'hisoka').segment((error as Error).message) }]
    }
  })
}
