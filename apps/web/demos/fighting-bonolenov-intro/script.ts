import { Shot } from '../fighting-chrollo-intro/reel'
import { split } from '../fighting-chrollo-intro/script'
import type { BuiltSegment } from '../fighting-chrollo-intro/hero'
import { speakBattleWords } from '../../src/lib/fighting/battleConversation'
import type { FightStageId } from '../../src/lib/fighting/stages'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'

type Options = ConstructorParameters<typeof Shot>[2]
const shot = (stage: FightStageId, opponent: FighterId, options: Options = {}) =>
  new Shot(stage, opponent, { hero: 'bonolenov', ...options })
type Scene = () => Shot

/** Battle Cantabile pieces are moveset commands: Prologue, spear, Metamorphosen, Jupiter. */
const piece = (s: Shot, slot: 'neutralSpecial' | 'forwardSpecial' | 'downSpecial' | 'finisher') =>
  s.move(slot)
/** A spoken line, recorded on the current frame (the model's reply in the exchange). */
function say(s: Shot, side: FightSide) {
  s.state = speakBattleWords(s.state, side)
  s.states[s.frame] = s.state
}
const preparing = (s: Shot) => Boolean(s.state.player.battleCantabile?.preparation)

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
  const s = shot('heilly-hideout', 'kurapika', { gap: 10 })
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

/** Ordinary blows unwrap the body: from here on every move plays a note. */
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

/** Prologue: the dance plays his body, then the conjured warrior's spear thrusts. */
const prologue: Scene = () => {
  const s = shot('whale-hold', 'zakuro', { gap: 9 })
  s.step(6)
  s.portrait('bust', 60)
  piece(s, 'neutralSpecial')
  s.beat('BATTLE CANTABILE', 'His body is the instrument')
  for (let i = 0; i < 80 && preparing(s); i++) s.step()
  s.beat('PROLOGUE', 'The warrior’s spear')
  s.step(10)
  s.approach('player', 6)
  piece(s, 'forwardSpecial')
  s.beat('SPEAR THRUST', 'Every step is a note')
  s.hits(1, 'player', 60)
  s.step(36)
  return s
}

/** Metamorphosen: a real exchange of words with Chrollo, then the dance becomes him. */
const metamorphosen: Scene = () => {
  const s = shot('observation-deck', 'chrollo', { gap: 14 })
  s.step(6)
  say(s, 'player')
  s.beat('THE EXCHANGE', 'He learns a model by talking to it')
  s.step(20)
  say(s, 'opponent')
  s.step(110)
  piece(s, 'downSpecial')
  s.beat('METAMORPHOSEN', 'The dance turns him into his model')
  for (let i = 0; i < 70 && preparing(s); i++) s.step()
  s.beat('', 'Chrollo’s face. None of his powers.')
  s.step(70)
  s.move('backSpecial')
  s.step(30)
  return s
}

/** In hides the aura; the strike still sings. */
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

const vanish: Scene = () => {
  const s = shot('supreme-court', 'machi', { gap: 12 })
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
 * Signature, one fight cut across stages: J (Ryu) · J · →J, then the Jupiter dance filmed
 * facing him, and the planet he calls hunts the target down inside the music's range.
 */
const signature: Scene = () => {
  const s = shot('heavens-arena', 'hisoka', { gap: 6 })
  s.step(6)
  s.held.player = { focusHands: true }
  s.beat('SIGNATURE COMBO', 'J · J · →J · Jupiter')
  s.press('light')
  s.hits(1)
  s.cut('vip-casino')
  s.press('light')
  s.hits(1)
  s.cut('supreme-court')
  s.press('light', { right: true })
  s.hits(1, 'player', 90)
  s.held.player = {}
  s.idle()
  // Jupiter needs room: it is born on him and has to chase the target down.
  s.step(54, { left: true })
  s.step(6)
  s.cut('banquet-hall')
  s.portrait('front', 90, -2)
  piece(s, 'finisher')
  s.beat('JUPITER', 'The dance calls a planet')
  for (let i = 0; i < 110 && preparing(s); i++) s.step()
  s.beat('', 'It follows the music to him')
  s.hits(1, 'player', 120)
  s.step(70)
  return s
}

const SCENES: Array<[string, Scene]> = [
  ['face', face],
  ['aura', aura],
  ['combo', combo],
  ['projection', projection],
  ['prologue', prologue],
  ['metamorphosen', metamorphosen],
  ['hidden', hidden],
  ['vanish', vanish],
  ['sight', sight],
  ['defence', defence],
  ['oath', oath],
  ['signature', signature],
]

export function buildBonolenovReel(): BuiltSegment[] {
  return SCENES.flatMap(([id, scene]) => {
    try {
      return split(id, scene().segment())
    } catch (error) {
      return [{ id, ...shot('heavens-arena', 'hisoka').segment((error as Error).message) }]
    }
  })
}
