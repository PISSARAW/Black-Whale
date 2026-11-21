import { Shot } from '../fighting-chrollo-intro/reel'
import { split } from '../fighting-chrollo-intro/script'
import type { NenSegment, NenTopic } from '../fighting-nen-explained/chapters'
import { RULE_SCENES } from '../fighting-clash-new-rules/script'

/**
 * What makes a Clash fight unlike any other: the mind behind the aura, attention as a
 * resource, fatigue that stays, aura that has to travel, and support kameos. Every
 * gauge on screen is read from the engine state of the frame it is drawn on.
 */
type Scene = () => Shot
const until = (s: Shot, done: () => boolean, limit = 90) => {
  for (let i = 0; i < limit && !done(); i++) s.step()
}
const SECTION = {
  title: 'INSIDE A CLASH FIGHT',
  items: ['PSYCHOLOGY', 'PERCEPTION', 'OVERLOAD', 'FATIGUE', 'RYU FLOW', 'COMBOS', 'KAMEOS'],
}
const topic = (concept: string, example: string, meters: NenTopic['meters']): NenTopic => ({
  chapter: 0,
  concept,
  example,
  section: SECTION,
  meters,
})

const title: Scene = () => {
  const s = new Shot('heavens-arena', 'franklin', { hero: 'hisoka', gap: 10 })
  s.card = 'title'
  s.held.player = { aura: true }
  s.portrait('face', 84)
  s.step(84)
  return s
}

/** The aura shows the mind: Franklin's Gyo reads pressure, stability and intent. */
const psychology: Scene = () => {
  const s = new Shot('heavens-arena', 'franklin', { hero: 'hisoka', gap: 6 })
  s.held.opponent = { gyo: true }
  s.step(6)
  s.beat('AURA PSYCHOLOGY', 'Aura shows the mind. Gyo can read it.')
  s.step(30)
  s.held.player = { aura: true }
  s.beat('', 'Ren: the pressure rises')
  s.step(34)
  s.press('heavy', { aura: true })
  s.beat('', 'Attack: the intent turns hostile')
  s.hits(1, 'player', 50)
  s.idle()
  s.step(10)
  s.held.player = { down: true, aura: true }
  s.beat('', 'Zetsu: nothing left to read')
  s.step(36)
  s.held = { player: {}, opponent: {} }
  return s
}

/** What you see depends on your eyes: In hides the gum, and only Gyo shows it. */
const perception: Scene = () => {
  const s = new Shot('screening-room', 'hisoka', { hero: 'chrollo', gap: 8 })
  s.step(6)
  s.held.opponent = { conceal: true }
  s.beat('PERCEPTION', 'Each player sees only what their Nen can see')
  s.move('neutralSpecial', { conceal: true }, 'opponent')
  s.step(24)
  s.held.player = { gyo: true }
  s.beat('', 'In hides the gum. Gyo reveals it.')
  s.step(46)
  s.held = { player: {}, opponent: {} }
  return s
}

/** Franklin's barrage under Ren: ten Nen bullets to steer at once, then nothing new fits. */
const overload: Scene = () => {
  const s = new Shot('supreme-court', 'hisoka', { hero: 'franklin', gap: 40 })
  s.held.player = { aura: true }
  s.step(4)
  s.move('neutralSpecial')
  s.beat('COGNITIVE OVERLOAD', 'Attention is a resource. Every Nen costs some.')
  until(s, () => s.state.projectiles.length >= 8, 60)
  s.move('neutralSpecial')
  s.beat('', 'Too much at once: the next Hatsu is refused')
  s.step(60)
  s.held.player = {}
  s.step(20)
  return s
}

/** Three barrages in a row: every overload leaves fatigue behind, and most of it stays. */
const fatigue: Scene = () => {
  const s = new Shot('whale-hold', 'hisoka', { hero: 'franklin', gap: 40 })
  s.held.player = { aura: true }
  s.step(4)
  s.beat('LONG-TERM FATIGUE', 'Every overload wears the mind down')
  for (let volley = 0; volley < 3; volley++) {
    s.move('neutralSpecial')
    s.step(10)
    s.idle('player', 120)
    until(s, () => !s.state.projectiles.length, 90)
    if (volley === 1) s.beat('', 'Less capacity, slower Ryu. 75% stays into the next round.')
  }
  s.held.player = {}
  s.step(20)
  return s
}

/** Two fighters, the same shifts of aura between fists and feet: one flows, one lags. */
function ryuRun(hero: 'biscuit' | 'hisoka') {
  const s = new Shot('banquet-hall', 'kurapika', { hero, gap: 6 })
  s.step(6)
  for (let round = 0; round < 2; round++) {
    s.held.player = { focusHands: true }
    s.step(3)
    s.press('light')
    s.step(22)
    s.held.player = { focusFeet: true }
    s.step(3)
    s.press('heavy', { down: true })
    s.step(26)
  }
  s.held.player = {}
  s.step(10)
  return s
}
const ryu: Scene = () => {
  const top = ryuRun('biscuit')
  const bottom = ryuRun('hisoka')
  while (top.frame < bottom.frame) top.step()
  while (bottom.frame < top.frame) bottom.step()
  top.beats.push({ at: 4, word: 'RYU FLOW', line: 'Aura travels between limbs. It takes time.' })
  top.twin = bottom
  return top
}
/** The shifts last a handful of frames: the shot plays at a third of real speed. */
const RYU_SLOW = 0.35

/** One button, four endings: J · J, then the direction of the last J chooses. */
const combos: Scene = () => {
  const s = new Shot('banquet-hall', 'hisoka', { hero: 'phinks', gap: 6 })
  s.step(6)
  s.held.player = { focusHands: true }
  s.beat('COMBO GRAMMAR', 'J · J · direction + J picks the ending')
  s.press('light')
  s.hits(1)
  s.press('light')
  s.hits(1)
  s.press('light', { jump: true })
  s.hits(1)
  s.held.player = {}
  s.beat('', '↑J launches. Ko catches him in the air.')
  for (let d = 0; d < 30; d += 2) {
    const before = s.state.player.attack
    s.press('light', { aura: true })
    if (s.state.player.attack && s.state.player.attack !== before) break
    s.step(2)
  }
  s.hits(1, 'player', 60)
  s.step(36)
  return s
}

/** A support kameo from the ship: Tubeppa answers the call and closes the leader's wounds. */
const kameo: Scene = () => {
  const s = new Shot('vip-casino', 'phinks', { hero: 'kurapika', gap: 6, kameos: { player: 'tubeppa' } })
  s.step(4)
  for (let i = 0; i < 2; i++) {
    s.approach('opponent', 4)
    s.press('heavy', {}, 'opponent')
    s.hits(1, 'opponent', 50)
    s.step(10)
  }
  until(s, () => !s.state.player.hitStun && !s.state.player.knockdownFrames, 90)
  s.step(1, { kameo: true })
  s.beat('KAMEOS', 'Call a support character from the ship')
  s.step(80)
  s.beat('', 'It can be hit, and it can die for good')
  s.step(60)
  return s
}

const PLAN: Array<[string, Scene, NenTopic | null]> = [
  ['title', title, null],
  ['psychology', psychology, topic('PSYCHOLOGY', 'HISOKA VS FRANKLIN', 'psychology')],
  ['perception', perception, topic('PERCEPTION', 'CHROLLO’S GYO · HISOKA’S IN', undefined)],
  ['overload', overload, topic('OVERLOAD', 'FRANKLIN · DOUBLE MACHINE GUN', 'load')],
  ['fatigue', fatigue, topic('FATIGUE', 'FRANKLIN · THREE BARRAGES IN A ROW', 'load')],
  ['ryu', ryu, topic('RYU FLOW', 'BISCUIT ABOVE · HISOKA BELOW', 'ryu')],
  ['combos', combos, topic('COMBOS', 'PHINKS · J · J · ↑J · KO', undefined)],
  ['kameo', kameo, topic('KAMEOS', 'KURAPIKA CALLS TUBEPPA', 'kameo')],
  ...RULE_SCENES,
]

export function buildSystemsReel(): NenSegment[] {
  let section: string | undefined
  return PLAN.flatMap(([id, scene, t]) => {
    const opens = t?.section?.title !== undefined && t.section.title !== section
    if (t?.section) section = t.section.title
    let parts
    try {
      parts = split(id, scene().segment())
    } catch (error) {
      parts = [{ id, ...new Shot('heavens-arena', 'hisoka').segment((error as Error).message) }]
    }
    if (id === 'ryu') parts = parts.map((part) => ({ ...part, slow: RYU_SLOW }))
    return parts.map((part, i) => ({ ...part, ...t, chapterStart: opens && i === 0 }))
  })
}
