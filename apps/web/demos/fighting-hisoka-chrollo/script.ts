import { Shot } from '../fighting-chrollo-intro/reel'
import { split } from '../fighting-chrollo-intro/script'
import type { BuiltSegment } from '../fighting-chrollo-intro/hero'
import { performArsenalAction } from '../../src/lib/fighting/arsenalExecution'
import { performAuraAttack } from '../../src/lib/fighting/engine'
import { createSunMoonVictoryWitness } from '../../src/lib/fighting/chrolloDetonation'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import type { FightSide, FighterId } from '../../src/lib/fighting/types'

/**
 * Hisoka vs Chrollo at Heavens Arena: one continuous fight in the production engine, cut
 * like a tournament highlight. Every blow, guard, Burst and Hatsu is a real command; the
 * Moon detonation ends it, and Chrollo's own Sun and Moon film closes the video.
 */
const STAGE = 'heavens-arena'
type Command = Parameters<typeof performArsenalAction>[0]['command']

const free = (s: Shot, side: FightSide) => {
  const f = s.state[side]
  return !f.hitStun && !f.knockdownFrames && !f.wakeupInvulnerableFrames && !f.attack
}
const recover = (s: Shot, side: FightSide = 'opponent', limit = 120) => {
  for (let i = 0; i < limit && !free(s, side); i++) s.step()
}
const act = (s: Shot, side: FightSide, command: Command) => {
  s.state = performArsenalAction({ state: s.state, side, command }, performAuraAttack)
  s.states[s.frame] = s.state
}
const gap = (s: Shot) => Math.abs(s.state.player.x - s.state.opponent.x)
/** Hisoka backs off until the two are `distance` apart. */
function spacing(s: Shot, distance: number) {
  for (let i = 0; i < 90 && gap(s) < distance; i++) s.step(1, { left: true })
  s.approach('player', distance)
}

/** J · J · ↑J, then (with `ko`) a Ko light catching the air: for either side. */
function airChain(s: Shot, side: FightSide, ko = true) {
  s.approach(side, 5)
  s.press('light', {}, side)
  s.hits(1, side, 40)
  s.press('light', {}, side)
  s.hits(1, side, 40)
  s.press('light', { jump: true }, side)
  s.hits(1, side, 50)
  if (!ko) return s.idle(side, 60)
  for (let d = 0; d < 30; d += 2) {
    const before = s.state[side].attack
    s.press('light', { aura: true }, side)
    if (s.state[side].attack && s.state[side].attack !== before) break
    s.step(2)
  }
  s.hits(1, side, 60)
  s.idle(side, 60)
}

/** Opening portraits: the two faces before the bell. */
function face(hero: FighterId, opponent: FighterId, title: boolean) {
  const s = new Shot(STAGE, opponent, { hero, gap: 10 })
  if (title) s.card = 'title'
  s.held.player = { aura: true }
  s.portrait('face', 60)
  s.step(60)
  return s
}

/** The fight itself, beat by beat. Returns the shot and which parts film Chrollo up close. */
function fight() {
  const s = new Shot(STAGE, 'chrollo', { hero: 'hisoka', gap: 14 })
  const chrolloParts = new Set<number>()
  // The bell: both settle in guard while ROUND 1 and FIGHT! are called.
  s.step(150)
  // 1. Opening range: a card wrapped in Shu.
  s.held.player = { shu: true }
  s.step(6)
  s.ranged()
  s.beat('SHU CARD', 'Hisoka opens from range')
  s.hits(1, 'player', 60)
  s.held.player = {}
  recover(s, 'player')
  recover(s, 'opponent')
  // 2. Chrollo walks through it: J · J · ↑J, Ko juggle.
  s.cut(STAGE)
  s.beat('CHROLLO', 'J · J · ↑J · Ko juggle')
  airChain(s, 'opponent')
  recover(s, 'player')
  // 3. Same frame, same Ko: the blows cancel.
  s.cut(STAGE)
  spacing(s, 13)
  s.press('light', { aura: true })
  s.press('light', { aura: true }, 'opponent')
  s.beat('KO CLASH!', 'Ren against Ren')
  for (let i = 0; i < 30 && !s.state.attackClash; i++) s.step()
  s.step(20)
  recover(s, 'opponent')
  recover(s, 'player')
  // 4. Bungee Gum, then the Elastic Execution.
  s.cut(STAGE)
  s.approach('player', 5)
  s.move('neutralSpecial')
  s.beat('BUNGEE GUM', 'Rubber and gum. He is attached.')
  for (let i = 0; i < 60 && !s.state.bungeeGum; i++) s.step()
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
  s.portrait('quarter', 50, -2)
  s.press('light', { right: true })
  s.beat('ELASTIC EXECUTION', 'J · J · →J')
  s.hits(1, 'player', 90)
  s.idle()
  recover(s, 'opponent')
  // 5. Benz's knife comes out.
  s.cut(STAGE)
  act(s, 'opponent', { action: 'weapon-ready' })
  s.beat('BENZ KNIFE', 'Poisoned steel')
  s.step(14)
  for (let i = 0; i < 2; i++) {
    s.approach('opponent', 5)
    s.press('light', {}, 'opponent')
    s.hits(1, 'opponent', 50)
    s.idle('opponent', 40)
  }
  recover(s, 'player')
  // 6. Texture Surprise: the next touch peels it.
  s.cut(STAGE)
  s.move('downSpecial')
  s.beat('TEXTURE SURPRISE', 'Fake as a card trick')
  s.idle('player', 90)
  s.approach('opponent', 5)
  s.press('heavy', {}, 'opponent')
  s.hits(1, 'opponent', 60)
  recover(s, 'player')
  // 7. The Sun is set on him.
  s.cut(STAGE)
  s.approach('opponent', 5)
  s.move('neutralSpecial', {}, 'opponent')
  s.beat('SUN', 'Sun and Moon: the first mark')
  for (let i = 0; i < 60 && !s.state.player.hatsuEffects.sunMark; i++) s.step()
  s.idle('opponent', 60)
  recover(s, 'player')
  // 8. Caught again, Hisoka bursts out.
  s.cut(STAGE)
  s.approach('opponent', 5)
  s.press('light', {}, 'opponent')
  s.hits(1, 'opponent', 40)
  s.press('light', {}, 'opponent')
  s.hits(1, 'opponent', 40)
  s.step(1, { burst: true })
  s.beat('BURST!', 'Half his aura to break free')
  s.step(40)
  recover(s, 'opponent')
  // 9. Wear him down until the Moon can finish it.
  // Highlight edit: the first and last of these exchanges stay, the ones between are cut.
  const worn: number[] = []
  for (let round = 0; round < 14 && s.state.player.health > 60; round++) {
    recover(s, 'player')
    s.cut(STAGE)
    worn.push(s.splits.length)
    airChain(s, 'opponent', false)
  }
  // Single blows bring him into the Moon's range without finishing him.
  for (let i = 0; i < 30 && s.state.player.health > 20; i++) {
    recover(s, 'player')
    s.approach('opponent', 5)
    s.press('light', {}, 'opponent')
    s.hits(1, 'opponent', 40)
    s.idle('opponent', 40)
  }
  const skipped = new Set(worn.slice(1, -1))
  if (skipped.size) s.beats.push({ at: s.splits.at(-1)!.at + 2, word: 'THE BATTLE RAGES ON', line: '' })
  recover(s, 'player')
  recover(s, 'opponent')
  // The Moon needs its aura: Chrollo keeps his distance while it comes back.
  const moonCost = moveForSlot('chrollo', 'finisher')?.auraCost ?? 0
  for (let i = 0; i < 900 && s.state.opponent.aura < moonCost + 4; i++) s.step()
  // The knife goes back before Double Face: the Moon is a palm, not a cut.
  if (s.state.opponent.historicalWeapon) act(s, 'opponent', { action: 'weapon-ready' })
  s.step(14)
  // 10. The book closes, facing camera, and the Moon lands.
  chrolloParts.add(s.splits.length + 1)
  s.cut(STAGE)
  s.portrait('front', 46, -2)
  s.move('downSpecial', {}, 'opponent')
  s.beat('', 'He closes the book')
  s.idle('opponent', 60)
  s.step(4)
  s.cut(STAGE)
  // A fresh exchange: the Moon is not a combo continuation.
  for (let i = 0; i < 120 && (s.state.player.comboHits > 0 || !free(s, 'player')); i++) s.step()
  s.approach('opponent', 4.5)
  s.move('finisher', {}, 'opponent')
  s.beat('MOON', 'Sun and Moon. Boom.')
  for (let i = 0; i < 120 && s.state.phase !== 'finished'; i++) s.step()
  s.step(30)
  if (s.state.phase !== 'finished') throw new Error(`no KO: Hisoka still has ${s.state.player.health}`)
  // The engine's own witness decides whether the decisive Sun and Moon film plays.
  const witness = createSunMoonVictoryWitness()
  if (s.states.some((state) => witness(state)))
    s.filmVariant = { variant: 'chrollo-sun-moon', duration: 3 }
  s.cut(STAGE)
  s.film(0)
  s.step(180)
  return { s, chrolloParts, skipped }
}

export function buildDuelReel(): BuiltSegment[] {
  const parts: BuiltSegment[] = [
    ...split('hisoka', face('hisoka', 'chrollo', true).segment()),
    ...split('chrollo', face('chrollo', 'hisoka', false).segment()),
  ]
  try {
    const { s, chrolloParts, skipped } = fight()
    const pieces = split('fight', s.segment())
      .map((part, i) => (chrolloParts.has(i) ? { ...part, hero: 'chrollo' as const } : part))
      .filter((_, i) => !skipped.has(i))
    parts.push(...pieces)
  } catch (error) {
    parts.push({ id: 'fight', ...new Shot(STAGE, 'chrollo').segment((error as Error).message) })
  }
  return parts
}
