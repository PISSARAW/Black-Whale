import { Shot } from '../fighting-chrollo-intro/reel'
import { split } from '../fighting-chrollo-intro/script'
import type { BuiltSegment } from '../fighting-chrollo-intro/hero'
import type { FightStageId } from '../../src/lib/fighting/stages'
import { act, recover, until } from './passages'
import { performArsenalCommand } from '../../src/lib/fighting/retrospectiveArsenal'
import { brawl } from './brawl'

/**
 * Hisoka vs Chrollo, one continuous fight in the production engine, edited like a film:
 * both entrances, hand-to-hand exchanges where Chrollo fights with the game's own AI, then
 * the book in the order the manga opens it (Benz's knife, Black Voice, Gallery Fake and
 * Order Stamp, Sun and Moon), Hisoka's gum in between, and no winner: the last frame is the
 * instant two Ko meet.
 */
const STAGE = 'central-dining-hall' as FightStageId
const CHROLLO_CLOSE_UPS = new Set<number>()

/** A Black Voice phone order from Chrollo's side, aimed at Hisoka. */
function voice(s: Shot, action: 'voice-phone' | 'voice-stay' | 'voice-pocket' | 'voice-remove') {
  s.state = performArsenalCommand(s.state, 'opponent', { action, target: 'player' })
  s.states[s.frame] = s.state
  s.step(6)
}

/** Film Chrollo for the next part (the part opened by this cut). */
function onChrollo(s: Shot) {
  s.cut(STAGE)
  CHROLLO_CLOSE_UPS.add(s.splits.length)
}

/** Both entrances, held in the ready phase, with the pair's own pre-fight lines. */
function entrances() {
  const s = new Shot(STAGE, 'chrollo', { hero: 'hisoka', gap: 12, ready: true })
  s.entrance = 0
  s.beat('', 'HISOKA · “Let us give this duel our full attention.”')
  s.hold(144)
  s.cut(STAGE)
  s.beat('', 'CHROLLO · “Then watch every choice.”')
  s.hold(144)
  s.cut(STAGE)
  s.hold(96)
  return s
}

/** I. Hand to hand: Chrollo fights with the game's AI while the camera circles them. */
function handToHand(s: Shot) {
  s.cut(STAGE)
  s.portrait('profile', 110)
  brawl(s, { frames: 110, seed: 3 })
  s.cut(STAGE)
  brawl(s, { frames: 130, seed: 5 })
  s.cut(STAGE)
  s.portrait('wide-low', 110)
  brawl(s, { frames: 110, seed: 8 })
}

/** A card wrapped in Shu, thrown from range: Hisoka's first answer. */
function shuCard(s: Shot) {
  s.cut(STAGE)
  recover(s, 'player')
  for (let i = 0; i < 60 && Math.abs(s.state.player.x - s.state.opponent.x) < 16; i++)
    s.step(1, { left: true })
  s.held.player = { shu: true }
  s.step(6)
  s.ranged()
  s.beat('SHU', 'A playing card, sharp as a blade')
  s.hits(1, 'player', 50)
  s.held.player = {}
  s.step(16)
  s.cut(STAGE)
  s.portrait('profile', 120)
  brawl(s, { frames: 140, seed: 9 })
}

/** II. Hisoka's gum: stuck to him, pulled in, struck. */
function gumPull(s: Shot) {
  s.cut(STAGE)
  recover(s, 'opponent')
  recover(s, 'player')
  s.approach('player', 5)
  s.move('neutralSpecial')
  s.beat('BUNGEE GUM', 'Rubber and gum. He is attached.')
  until(s, () => Boolean(s.state.bungeeGum), 60)
  s.idle('player', 60)
  s.step(14, { left: true })
  s.move('forwardSpecial')
  s.step(18)
  s.press('heavy')
  s.hits(1, 'player', 50)
  s.idle()
  s.cut(STAGE)
  s.portrait('over', 90)
  brawl(s, { frames: 120, seed: 13 })
}

/** III and IV. Benz's knife, then Black Voice: the antenna takes his body. */
function knifeAndVoice(s: Shot) {
  onChrollo(s)
  recover(s, 'opponent')
  recover(s, 'player')
  act(s, { action: 'weapon-ready' }, 'opponent')
  s.portrait('bust', 30)
  s.beat('BENZ KNIFE', 'Poisoned steel from a dead man')
  s.step(16)
  s.cut(STAGE)
  for (let i = 0; i < 2; i++) {
    s.approach('opponent', 5)
    s.press('light', {}, 'opponent')
    s.hits(1, 'opponent', 50)
    s.idle('opponent', 40)
  }
  recover(s, 'player')
  s.cut(STAGE)
  if (s.state.opponent.historicalWeapon) act(s, { action: 'weapon-ready' }, 'opponent')
  s.step(14)
  act(s, { action: 'history-page', target: 'black-voice' }, 'opponent')
  s.step(14)
  s.approach('opponent', 5)
  s.move('neutralSpecial', {}, 'opponent')
  s.beat('BLACK VOICE', 'The antenna goes in')
  s.step(55)
  // The phone gives the order: Hisoka's body stays where it is.
  voice(s, 'voice-phone')
  voice(s, 'voice-stay')
  s.beat('', '“Stay.” His body obeys the antenna.')
  for (let i = 0; i < 2; i++) {
    s.approach('opponent', 5)
    s.press(i ? 'heavy' : 'light', {}, 'opponent')
    s.hits(1, 'opponent', 50)
    s.idle('opponent', 40)
  }
  // The phone goes back in his pocket: his hands are free for the next page.
  voice(s, 'voice-pocket')
  recover(s, 'player')
  s.cut(STAGE)
  brawl(s, { frames: 100, seed: 21 })
}

/** V. Gallery Fake and Order Stamp: a copy of Hisoka, then the puppet sent at him. */
function puppets(s: Shot) {
  onChrollo(s)
  recover(s, 'opponent')
  act(s, { action: 'history-page', target: 'gallery-fake' }, 'opponent')
  s.step(14)
  s.move('downSpecial', {}, 'opponent')
  s.idle('opponent', 40)
  s.step(4)
  act(s, { action: 'history-use', target: 'player' }, 'opponent')
  s.beat('GALLERY FAKE', 'His own shape, copied')
  s.step(40)
  s.cut(STAGE)
  s.portrait('high', 120)
  act(s, { action: 'history-page', target: 'order-stamp' }, 'opponent')
  s.step(14)
  act(s, { action: 'history-use' }, 'opponent')
  s.beat('ORDER STAMP', 'The copy becomes a puppet')
  s.step(20)
  act(s, { action: 'history-order-attack' }, 'opponent')
  s.hits(1, 'opponent', 110)
  s.step(20)
  // VI. Hisoka answers in kind: gum on his own heart, for later.
  s.cut(STAGE)
  recover(s, 'player')
  s.state = performArsenalCommand(s.state, 'player', { action: 'gum-heart' })
  s.states[s.frame] = s.state
  s.portrait('face', 60)
  s.beat('', 'Gum around his own heart. Just in case.')
  s.step(60)
}

/** Texture Surprise: what you see on Hisoka is only what he painted there. */
function texture(s: Shot) {
  s.cut(STAGE)
  recover(s, 'player')
  s.move('downSpecial')
  s.portrait('bust', 60)
  s.beat('TEXTURE SURPRISE', 'Thin as paper. Fake as a card trick.')
  s.idle('player', 90)
  s.step(10)
}

/** VII. Sun and Moon: the Sun on contact, Double Face, the Moon, and the blast. */
function sunAndMoon(s: Shot) {
  s.cut(STAGE)
  act(s, { action: 'history-page', target: 'sun-and-moon' }, 'opponent')
  s.step(14)
  s.approach('opponent', 5)
  s.move('neutralSpecial', {}, 'opponent')
  s.beat('SUN', 'The first mark')
  until(s, () => Boolean(s.state.player.hatsuEffects.sunMark), 60)
  s.idle('opponent', 60)
  recover(s, 'player')
  onChrollo(s)
  s.portrait('front', 46)
  s.move('downSpecial', {}, 'opponent')
  s.beat('', 'He closes the book')
  s.idle('opponent', 60)
  s.step(6)
  s.cut(STAGE)
  for (let i = 0; i < 120 && (s.state.player.comboHits > 0 || s.state.player.hitStun); i++) s.step()
  s.approach('opponent', 4.5)
  s.portrait('wide-low', 90)
  s.move('finisher', {}, 'opponent')
  s.beat('MOON', 'Sun and Moon')
  s.step(80)
  recover(s, 'player')
}

/** VIII. Hisoka still smiling: gum, J · J · →J, the Elastic Execution. */
function elastic(s: Shot) {
  s.cut(STAGE)
  s.approach('player', 5)
  s.move('neutralSpecial')
  until(s, () => Boolean(s.state.bungeeGum), 60)
  s.idle('player', 60)
  recover(s, 'opponent')
  s.approach('player', 5)
  s.held.player = { focusHands: true }
  s.press('light')
  s.hits(1)
  s.press('light')
  s.hits(1)
  s.held.player = {}
  s.cut(STAGE)
  s.portrait('quarter', 50)
  s.press('light', { right: true })
  s.beat('ELASTIC EXECUTION', 'J · J · →J')
  s.hits(1, 'player', 90)
  s.idle()
  s.cut(STAGE)
  brawl(s, { frames: 110, seed: 34 })
}

/** Both step back, gather everything, two faces, and two Ko meet: the film ends there. */
function finale(s: Shot) {
  s.cut(STAGE)
  recover(s, 'opponent')
  recover(s, 'player')
  s.ai = false
  for (let i = 0; i < 90 && Math.abs(s.state.player.x - s.state.opponent.x) < 13; i++)
    s.step(1, { left: true }, { right: true })
  s.approach('player', 13)
  s.portrait('wide-low', 90)
  s.beat('', 'Everything, in one fist')
  // The stand-off lasts until both can pay for a Ko.
  for (let i = 0; i < 600 && Math.min(s.state.player.aura, s.state.opponent.aura) < 21; i++) s.step()
  s.step(20)
  s.cut(STAGE)
  s.portrait('eyes', 34)
  s.step(34)
  onChrollo(s)
  s.portrait('eyes', 34)
  s.step(34)
  s.cut(STAGE)
  s.press('light', { aura: true })
  s.press('light', { aura: true }, 'opponent')
  s.portrait('profile', 40)
  for (let i = 0; i < 40 && !s.state.attackClash; i++) s.step()
  s.beat('KO CLASH', '')
  s.step(36)
}

function fight() {
  const s = new Shot(STAGE, 'chrollo', { hero: 'hisoka', gap: 12 })
  s.step(70)
  const acts = [handToHand, shuCard, gumPull, knifeAndVoice, puppets, sunAndMoon]
  for (const scene of [...acts, texture, elastic, finale]) scene(s)
  return s
}

/** Long stretches become shots of a few seconds: a film cut, not one long take. */
function chunk(s: Shot, longest = 200) {
  const cuts = [0, ...s.splits.map((c) => c.at), s.frame]
  for (let i = 0; i < cuts.length - 1; i++)
    for (let at = cuts[i] + longest; at < cuts[i + 1] - 40; at += longest)
      s.splits.push({ at, stage: STAGE })
  s.splits.sort((a, b) => a.at - b.at)
}

export function buildDuelReel(): BuiltSegment[] {
  const parts: BuiltSegment[] = split('entrance', entrances().segment()).map((part) => ({
    ...part,
    steady: true,
  }))
  try {
    CHROLLO_CLOSE_UPS.clear()
    const s = fight()
    const closeUps = new Set([...CHROLLO_CLOSE_UPS].map((index) => s.splits[index - 1].at))
    chunk(s)
    parts.push(
      ...split('fight', s.segment()).map((part, i) => ({
        ...part,
        steady: true,
        ...(i > 0 && closeUps.has(s.splits[i - 1].at) ? { hero: 'chrollo' as const } : {}),
      })),
    )
  } catch (error) {
    parts.push({ id: 'fight', ...new Shot(STAGE, 'chrollo').segment((error as Error).message) })
  }
  return parts
}
