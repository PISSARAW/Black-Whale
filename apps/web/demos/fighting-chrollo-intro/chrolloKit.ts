import { Shot } from './reel'
import { performArsenalCommand } from '../../src/lib/fighting/retrospectiveArsenal'
import { performArsenalAction } from '../../src/lib/fighting/arsenalExecution'
import { performAuraAttack } from '../../src/lib/fighting/engine'
import type { FightSide } from '../../src/lib/fighting/types'

/**
 * The rest of Chrollo's kit for the full presentation: Skill Hunter's real acquisition,
 * the historical pages that need setup (Gallery Fake, Order Stamp, Convert Hands,
 * Fun Fun Cloth, Love Dial 6700) and Benz's knife. Every effect goes through the
 * production arsenal commands; nothing here edits combat state by hand.
 */
type Scene = () => Shot
type Command = Parameters<typeof performArsenalCommand>[2]

/** An arsenal command for either side, recorded on the current frame like `Shot.arsenal`. */
function act(s: Shot, command: Command, side: FightSide = 'player') {
  s.state = performArsenalCommand(s.state, side, command)
  s.states[s.frame] = s.state
}

/** Open a historical page through the book, then let the page turn finish. */
function openPage(s: Shot, target: string) {
  act(s, { action: 'history-page', target })
  s.step(14)
}

/** Close the book on its bookmark: frees the right hand for two-handed pages. */
function closeBook(s: Shot) {
  s.move('downSpecial')
  s.idle()
  s.step(4)
}

/** He must see the Hatsu, ask how it works, hear the answer and touch with the book. */
const steal: Scene = () => {
  const s = new Shot('tserriednich-salon', 'franklin', { gap: 16 })
  s.step(6)
  s.held.player = { guard: true }
  s.move('neutralSpecial', {}, 'opponent')
  s.beat('SKILL HUNTER', 'First, he watches the Hatsu')
  s.idle('opponent', 120)
  s.held.player = {}
  s.approach('player', 9)
  s.step(4)
  act(s, { action: 'hunter-ask' })
  s.beat('THE QUESTION', '“How does your ability work?”')
  s.step(40)
  act(s, { action: 'hunter-answer' }, 'opponent')
  s.step(20)
  s.approach('player', 5)
  s.move('forwardSpecial')
  s.beat('STOLEN', 'His palm on the book. The page is his.')
  s.hits(1, 'player', 70)
  s.idle()
  s.step(40)
  s.approach('player', 6)
  s.move('neutralSpecial')
  s.beat('BANDIT’S SECRET', 'Franklin’s guns, from Chrollo’s hands')
  s.idle('player', 90)
  s.step(50)
  return s
}

/** Gallery Fake makes an inert copy; Order Stamp animates it and sends it in. */
const copies: Scene = () => {
  const s = new Shot('screening-room', 'hisoka', { gap: 6, centre: 88, preparation: true })
  s.step(4)
  openPage(s, 'gallery-fake')
  s.beat('GALLERY FAKE', 'Touch with the left, create with the right')
  closeBook(s)
  act(s, { action: 'history-use', target: 'opponent' })
  s.step(40)
  openPage(s, 'order-stamp')
  act(s, { action: 'history-use' })
  s.beat('ORDER STAMP', 'The copy becomes a puppet')
  s.step(20)
  act(s, { action: 'history-order-attack' })
  s.beat('', 'Break the target')
  s.hits(1, 'player', 120)
  s.step(40)
  return s
}

/** Convert Hands: both hands on him, and the two faces trade places. */
const hands: Scene = () => {
  const s = new Shot('vip-casino', 'phinks', { gap: 5, preparation: true })
  s.step(4)
  openPage(s, 'convert-hands')
  closeBook(s)
  s.approach('player', 4)
  act(s, { action: 'history-shape-swap' })
  s.beat('CONVERT HANDS', 'Both hands. Faces swapped.')
  s.step(80)
  return s
}

/** Fun Fun Cloth wraps him and shrinks him away, then gives him back untouched. */
const cloth: Scene = () => {
  const s = new Shot('observation-deck', 'machi', { gap: 5, preparation: true })
  s.step(4)
  openPage(s, 'fun-fun-cloth')
  closeBook(s)
  s.approach('player', 4)
  act(s, { action: 'history-use' })
  s.beat('FUN FUN CLOTH', 'Wrapped. Gone.')
  s.step(60)
  act(s, { action: 'history-release' })
  s.beat('', 'Returned intact')
  s.step(40)
  return s
}

/** Love Dial 6700: type a Nen profile into the conjured phone, dial, get a location. */
const phone: Scene = () => {
  const s = new Shot('heilly-hideout', 'kurapika', { gap: 26, preparation: true })
  s.step(4)
  openPage(s, 'love-dial-6700')
  act(s, { action: 'history-phone-criteria', target: 'ability:kurapika' })
  s.beat('LOVE DIAL 6700', 'Search: Chain Jail')
  s.step(24)
  act(s, { action: 'history-phone-call' })
  s.beat('', 'The phone answers: he is right there')
  s.step(50)
  return s
}

/** Benz's knife drawn through the equipment command, then a real cut. */
const knife: Scene = () => {
  const s = new Shot('whale-hold', 'franklin', { gap: 14, bookClosed: true })
  s.step(4)
  s.state = performArsenalAction(
    { state: s.state, side: 'player', command: { action: 'weapon-ready' } },
    performAuraAttack,
  )
  s.states[s.frame] = s.state
  s.beat('BENZ KNIFE', 'Poisoned blade, drawn')
  s.step(16)
  s.approach('player', 5)
  s.press('light')
  s.hits(1, 'player', 60)
  s.press('light')
  s.hits(1, 'player', 60)
  s.step(40)
  return s
}

export const KIT_SCENES = { steal, copies, hands, cloth, phone, knife }
