import { Shot } from '../fighting-chrollo-intro/reel'
import { split } from '../fighting-chrollo-intro/script'
import { KIT_SCENES as chrollo } from '../fighting-chrollo-intro/chrolloKit'
import { KIT_SCENES as kurapika } from '../fighting-kurapika-intro/kurapikaKit'
import { performAttack } from '../../src/lib/fighting/engine'
import type { FightStageId } from '../../src/lib/fighting/stages'
import type { FighterId } from '../../src/lib/fighting/types'
import { CHAPTERS, type NenSegment, type NenTopic } from './chapters'

/**
 * Nen explained by the roster: each concept is filmed on the fighter whose own engine
 * ability shows it best. Every effect is the production command; nothing is staged.
 */
type Scene = () => Shot
type Cast = { vs: FighterId; gap?: number; centre?: number }
const shot = (hero: FighterId, stage: FightStageId, cast: Cast) =>
  new Shot(stage, cast.vs, { hero, gap: cast.gap ?? 8, centre: cast.centre })
const until = (s: Shot, done: () => boolean, limit = 90) => {
  for (let i = 0; i < limit && !done(); i++) s.step()
}
const special = (s: Shot) => {
  s.state = performAttack(s.state, 'player', 'special')
  s.states[s.frame] = s.state
}

const title: Scene = () => {
  const s = shot('hisoka', 'heavens-arena', { vs: 'chrollo', gap: 10 })
  s.card = 'title'
  s.held.player = { aura: true }
  s.portrait('face', 84)
  s.step(84)
  return s
}

/* ---- The four principles ---- */
const ten: Scene = () => {
  const s = shot('kurapika', 'banquet-hall', { vs: 'feitan', gap: 9 })
  s.step(4)
  s.beat('TEN', 'Keep the aura wrapped around the body')
  s.step(52)
  return s
}
const zetsu: Scene = () => {
  const s = shot('feitan', 'observation-deck', { vs: 'machi', gap: 12 })
  s.step(4)
  s.held.player = { down: true, aura: true }
  s.step(2)
  s.beat('ZETSU', 'Close every pore. No aura, no presence.')
  s.step(54)
  s.held.player = {}
  return s
}
const ren: Scene = () => {
  const s = shot('franklin', 'whale-hold', { vs: 'kurapika', gap: 12 })
  s.step(4)
  s.held.player = { aura: true }
  s.step(2)
  s.beat('REN', 'Force the aura out. More power, more pressure.')
  s.step(54)
  s.held.player = {}
  return s
}
/** Hatsu: a personal ability. Bonolenov's body is an instrument; his dance is the Hatsu. */
const hatsu: Scene = () => {
  const s = shot('bonolenov', 'whale-hold', { vs: 'zakuro', gap: 9 })
  s.step(4)
  s.portrait('bust', 56)
  s.move('neutralSpecial')
  s.beat('HATSU', 'Your own ability. His body plays music.')
  until(s, () => !s.state.player.battleCantabile?.preparation, 80)
  s.approach('player', 6)
  s.move('forwardSpecial')
  s.hits(1, 'player', 50)
  s.step(20)
  return s
}

/* ---- The six types ---- */
const enhancer: Scene = () => {
  const s = shot('phinks', 'heavens-arena', { vs: 'hisoka', gap: 6 })
  s.step(4)
  special(s)
  s.beat('ENHANCER', 'Strengthen what you already have')
  s.step(108)
  special(s)
  s.step(2)
  s.press('finisher')
  s.beat('', 'Each turn of the arm adds power')
  s.hits(1, 'player', 60)
  s.step(30)
  return s
}
const transmuter: Scene = () => {
  const s = shot('hisoka', 'vip-casino', { vs: 'kalluto', gap: 5 })
  s.step(4)
  s.move('neutralSpecial')
  s.beat('TRANSMUTER', 'Change the aura’s properties')
  until(s, () => Boolean(s.state.bungeeGum), 60)
  s.idle('player', 60)
  s.step(16, { left: true })
  s.move('forwardSpecial')
  s.beat('', 'Aura with the properties of rubber and gum')
  s.step(44)
  return s
}
const emitter: Scene = () => {
  const s = shot('franklin', 'supreme-court', { vs: 'phinks', gap: 20 })
  s.step(4)
  s.move('neutralSpecial')
  s.beat('EMITTER', 'Send the aura away from the body')
  s.hits(2, 'player', 80)
  s.step(20)
  return s
}
const conjurer: Scene = () => {
  const s = shot('kurapika', 'heavens-arena', { vs: 'chrollo', gap: 6 })
  s.step(6)
  s.press('finisher', { aura: true })
  s.step(30)
  s.move('neutralSpecial')
  s.beat('CONJURER', 'Make a real object out of aura')
  s.step(90, {}, { right: true, aura: true })
  return s
}
const manipulator: Scene = () => {
  const s = shot('illumi', 'princes-burial-chamber', { vs: 'leorio', gap: 6 })
  s.step(4)
  s.move('neutralSpecial')
  s.beat('MANIPULATOR', 'Control people and things')
  until(s, () => Boolean(s.state.opponent.needlePuppet), 70)
  s.beat('', 'One needle, and the body obeys')
  s.step(70)
  return s
}
/** Skill Hunter's full route, reused from Chrollo's own presentation. */
const specialist: Scene = () => {
  const s = chrollo.steal()
  s.beats.splice(0, s.beats.length, {
    at: 6,
    word: 'SPECIALIST',
    line: 'An ability no other type can learn',
  })
  return s
}

/* ---- Advanced techniques ---- */
const hidden: Scene = () => {
  const s = shot('hisoka', 'princes-burial-chamber', { vs: 'illumi', gap: 6 })
  s.step(4)
  s.held.player = { conceal: true }
  s.step(6)
  s.beat('IN', 'Hide the aura. The gum is invisible.')
  s.approach('player', 5)
  s.move('neutralSpecial')
  until(s, () => Boolean(s.state.bungeeGum), 60)
  s.held.player = {}
  s.step(30)
  return s
}
const gyo: Scene = () => {
  const s = shot('chrollo', 'screening-room', { vs: 'hisoka', gap: 8 })
  s.step(6)
  s.held.opponent = { conceal: true }
  s.held.player = { gyo: true }
  s.step(4)
  s.beat('GYO', 'Aura in the eyes. Hidden aura shows.')
  s.move('neutralSpecial', { conceal: true }, 'opponent')
  s.step(56)
  s.held = { player: {}, opponent: {} }
  return s
}
const en: Scene = () => {
  const s = shot('hinrigh', 'observation-deck', { vs: 'feitan', gap: 18 })
  s.step(4)
  s.held.opponent = { down: true, aura: true }
  s.held.player = { en: true }
  s.step(4)
  s.beat('EN', 'Spread the aura. Feel everything inside it.')
  s.step(20)
  s.held.opponent = {}
  s.approach('opponent', 8)
  s.step(24)
  s.held.player = {}
  return s
}
const shu: Scene = () => {
  const s = shot('hisoka', 'whale-hold', { vs: 'zakuro', gap: 18 })
  s.step(4)
  s.held.player = { shu: true }
  s.step(6)
  s.beat('SHU', 'Aura into an object. A card becomes a blade.')
  s.ranged()
  s.hits(1, 'player', 50)
  s.held.player = {}
  s.step(24)
  return s
}
const ken: Scene = () => {
  // Back to the wall: the wall absorbs the block pushback, so the guard holds in place.
  const s = shot('benjamin', 'supreme-court', { vs: 'phinks', gap: 6, centre: 10 })
  s.step(4)
  s.held.player = { guard: true, aura: true }
  s.step(4)
  s.pressure(3, (n) => (n === 1 ? s.beat('KEN', 'Ten and Ren at once: total defence') : undefined))
  s.held.player = {}
  return s
}
const ko: Scene = () => {
  const s = shot('biscuit', 'heavens-arena', { vs: 'franklin', gap: 9 })
  s.step(4)
  s.approach('player', 5)
  s.press('heavy', { aura: true })
  s.beat('KO', 'Every drop of aura in one fist')
  s.hits(1, 'player', 60)
  s.step(34)
  return s
}
const ryu: Scene = () => {
  const s = shot('feitan', 'banquet-hall', { vs: 'phinks', gap: 6 })
  s.step(4)
  s.held.player = { focusHands: true }
  s.beat('RYU', 'Move the aura to the limb that strikes')
  s.press('light')
  s.hits(1)
  s.press('light')
  s.hits(1)
  s.press('light', { right: true })
  s.hits(1, 'player', 80)
  s.held.player = {}
  s.step(20)
  return s
}

/* ---- Vows and limitations ---- */
const vow: Scene = () => {
  const s = kurapika.judgment()
  s.beats.splice(0, s.beats.length, {
    at: 26,
    word: 'VOW',
    line: 'A strict rule makes the ability stronger',
  })
  const broken = s.states.findIndex((st) => st.opponent.health <= 0)
  if (broken > 0) s.beats.push({ at: broken - 20, word: '', line: 'Break the rule, pay the price' })
  return s
}
/** Cat's Name: Camilla is killed for real, the cat takes the killer's life and she returns. */
const postMortem: Scene = () => {
  const s = new Shot('heilly-hideout', 'hisoka', { hero: 'camilla', gap: 6, heroHealth: 14 })
  s.step(4)
  s.beat('POST-MORTEM', 'Some Nen only wakes when you die')
  for (let round = 0; round < 3 && !s.state.catsName; round++) {
    s.approach('opponent', 4)
    s.press('heavy', {}, 'opponent')
    until(s, () => Boolean(s.state.catsName) || !s.state.opponent.attack, 60)
    s.step(6)
  }
  s.beat('', 'The cat takes the killer’s life. She comes back.')
  until(s, () => !s.state.catsName, 160)
  s.step(40)
  return s
}
/** Pain Packer turns real wounds into armour; Rising Sun spends them as heat. */
const fullPower: Scene = () => {
  const s = shot('feitan', 'heavens-arena', { vs: 'hisoka', gap: 6 })
  s.step(4)
  for (let round = 0; round < 3 && s.state.player.health > s.state.player.maxHealth - 40; round++) {
    s.approach('opponent', 4)
    s.press('light', {}, 'opponent')
    s.hits(1, 'opponent', 50)
    s.press('heavy', {}, 'opponent')
    s.hits(1, 'opponent', 60)
    s.step(20)
  }
  until(s, () => !s.state.player.hitStun && !s.state.player.knockdownFrames, 90)
  s.portrait('front', 80, -2)
  s.press('special')
  s.beat('FULL POWER', 'Pain packed into armour')
  s.idle('player', 90)
  s.step(6)
  s.cut('observation-deck')
  s.press('finisher')
  s.beat('', 'Every wound paid back as a sun')
  s.step(150)
  return s
}

const PLAN: Entry[] = [
  ['title', title, null],
  ['ten', ten, { chapter: 0, concept: 'TEN', example: 'KURAPIKA · AT REST' }],
  ['zetsu', zetsu, { chapter: 0, concept: 'ZETSU', example: 'FEITAN · VANISHES' }],
  ['ren', ren, { chapter: 0, concept: 'REN', example: 'FRANKLIN · AURA SURGE' }],
  ['hatsu', hatsu, { chapter: 0, concept: 'HATSU', example: 'BONOLENOV · BATTLE CANTABILE' }],
  ['enhancer', enhancer, { chapter: 1, concept: 'ENHANCER', example: 'PHINKS · RIPPER CYCLOTRON' }],
  ['transmuter', transmuter, { chapter: 1, concept: 'TRANSMUTER', example: 'HISOKA · BUNGEE GUM' }],
  [
    'emitter',
    emitter,
    { chapter: 1, concept: 'EMITTER', example: 'FRANKLIN · DOUBLE MACHINE GUN' },
  ],
  ['conjurer', conjurer, { chapter: 1, concept: 'CONJURER', example: 'KURAPIKA · CHAIN JAIL' }],
  ['manipulator', manipulator, { chapter: 1, concept: 'MANIPULATOR', example: 'ILLUMI · NEEDLES' }],
  [
    'specialist',
    specialist,
    { chapter: 1, concept: 'SPECIALIST', example: 'CHROLLO · SKILL HUNTER' },
  ],
  ['in', hidden, { chapter: 2, concept: 'IN', example: 'HISOKA · HIDDEN GUM' }],
  ['gyo', gyo, { chapter: 2, concept: 'GYO', example: 'CHROLLO · SEES THE GUM' }],
  ['en', en, { chapter: 2, concept: 'EN', example: 'HINRIGH · AURA DOME' }],
  ['shu', shu, { chapter: 2, concept: 'SHU', example: 'HISOKA · CARD BLADE' }],
  ['ken', ken, { chapter: 2, concept: 'KEN', example: 'BENJAMIN · GUARD' }],
  ['ko', ko, { chapter: 2, concept: 'KO', example: 'BISCUIT · ONE PUNCH' }],
  ['ryu', ryu, { chapter: 2, concept: 'RYU', example: 'FEITAN · J · J · →J' }],
  ['vow', vow, { chapter: 3, concept: 'VOW', example: 'KURAPIKA · JUDGMENT CHAIN' }],
  [
    'post-mortem',
    postMortem,
    { chapter: 3, concept: 'POST-MORTEM', example: 'CAMILLA · CAT’S NAME' },
  ],
  ['full-power', fullPower, { chapter: 3, concept: 'FULL POWER', example: 'FEITAN · PAIN PACKER' }],
]

type Entry = [string, Scene, NenTopic | null]

export function buildNenReel(): NenSegment[] {
  let chapter = -1
  return PLAN.flatMap(([id, scene, topic]) => {
    const start = topic !== null && topic.chapter !== chapter
    if (topic) chapter = topic.chapter
    let parts
    try {
      parts = split(id, scene().segment())
    } catch (error) {
      const failed = shot('hisoka', 'heavens-arena', { vs: 'chrollo' })
      parts = [{ id, ...failed.segment((error as Error).message) }]
    }
    return parts.map((part, i) => ({ ...part, ...topic, chapterStart: start && i === 0 }))
  })
}

export { CHAPTERS }
