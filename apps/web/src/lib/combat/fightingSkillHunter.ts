import { moveForSlot } from '../fighting/movesets'
import type { MoveSlot } from '../fighting/types'
import { resolveFightingBlinky } from './fightingBlinky'
import { addPersistentNenEffect } from './effects'
import { castHatsu, type HatsuCast } from './hatsuCast'
import {
  otherSide,
  type ArenaBookSlot,
  type ArenaHatsuEffect,
  type ArenaSkillHunterBook,
  type BodyZone,
  type CombatAction,
  type CombatSide,
  type CombatState,
} from './types'

type FightingMoveAction = Extract<CombatAction, { type: 'FIGHTING_MOVE' }>

export const ARENA_SKILL_HUNTER_DECK = [
  'sun-and-moon',
  'black-voice',
  'order-stamp',
  'convert-hands',
] as const

const SKILL_HUNTER_SLOTS = new Set<MoveSlot>([
  'neutralSpecial',
  'forwardSpecial',
  'downSpecial',
  'backSpecial',
  'finisher',
])
const PALM_RANGE = 1.2

export function initialArenaSkillHunterBook(): ArenaSkillHunterBook {
  return {
    deck: ARENA_SKILL_HUNTER_DECK,
    stolenPage: null,
    selectedSlot: 0,
    open: true,
    bookmarkSlot: null,
  }
}

export function isSkillHunterMove(action: FightingMoveAction): boolean {
  return action.fighterId === 'chrollo' && SKILL_HUNTER_SLOTS.has(action.slot)
}

export function arenaBookPage(
  book: ArenaSkillHunterBook,
  slot: ArenaBookSlot = book.selectedSlot,
): string | null {
  return slot === 'stolen' ? book.stolenPage : book.deck[slot]
}

export function resolveFightingSkillHunter(
  state: CombatState,
  action: FightingMoveAction,
): CombatState {
  if (!isSkillHunterMove(action)) return state
  const book = state[action.side].skillHunterBook ?? initialArenaSkillHunterBook()
  if (action.slot === 'backSpecial') return turnPage(state, action, book)
  if (action.slot === 'downSpecial') return toggleBookmark(state, action, book)
  if (action.slot === 'forwardSpecial') return stealObservedHatsu(state, action, book)
  const slot = action.slot === 'finisher' ? book.bookmarkSlot : book.open ? book.selectedSlot : null
  return slot === null ? state : usePage({ state, action, book, slot })
}

function turnPage(
  state: CombatState,
  action: FightingMoveAction,
  book: ArenaSkillHunterBook,
): CombatState {
  if (!canHandleBook(state, action)) return state
  const slots: ArenaBookSlot[] = book.stolenPage ? [0, 1, 2, 3, 'stolen'] : [0, 1, 2, 3]
  const index = slots.indexOf(book.selectedSlot)
  const selectedSlot = slots[(index + 1) % slots.length]
  return spendUtility(state, action, { ...book, selectedSlot, open: true })
}

function toggleBookmark(
  state: CombatState,
  action: FightingMoveAction,
  book: ArenaSkillHunterBook,
): CombatState {
  if (!canHandleBook(state, action)) return state
  if (!book.open) return spendUtility(state, action, { ...book, open: true })
  const bookmarkSlot = book.bookmarkSlot === book.selectedSlot ? null : book.selectedSlot
  return spendUtility(state, action, { ...book, bookmarkSlot, open: bookmarkSlot === null })
}

function stealObservedHatsu(
  state: CombatState,
  action: FightingMoveAction,
  book: ArenaSkillHunterBook,
): CombatState {
  const target = otherSide(action.side)
  const page = state.lastHatsuBySide[target]
  if (!page || page === 'skill-hunter' || !canSteal(state, action, target)) return state
  const cleared = releaseStolenPage(state, action.side)
  const nextBook: ArenaSkillHunterBook = {
    ...book,
    stolenPage: page,
    selectedSlot: 'stolen',
    open: true,
  }
  const paid = spendUtility(cleared, action, nextBook)
  return addPersistentNenEffect(
    { ...paid, lastHatsuBySide: { ...paid.lastHatsuBySide, [action.side]: 'skill-hunter' } },
    {
      id: `skill-hunter-${action.side}`,
      kind: 'CAPTURED_ABILITY',
      owner: action.side,
      target,
      sourceHatsuId: 'skill-hunter',
      remaining: null,
      detail: page,
    },
  )
}

function canSteal(state: CombatState, action: FightingMoveAction, target: CombatSide): boolean {
  const fighter = state[action.side]
  const rival = state[target]
  return (
    canHandleBook(state, action) &&
    Math.hypot(fighter.position[0] - rival.position[0], fighter.position[1] - rival.position[1]) <=
      PALM_RANGE &&
    (!rival.in || fighter.gyo)
  )
}

function usePage(options: {
  state: CombatState
  action: FightingMoveAction
  book: ArenaSkillHunterBook
  slot: ArenaBookSlot
}): CombatState {
  const { state, action, book, slot } = options
  if (!canHandleBook(state, action)) return state
  const page = arenaBookPage(book, slot)
  if (!page) return state
  const withBook = putBook(state, action.side, book)
  if (page === 'blinky') return useBlinkyPage(withBook, action)
  const move = moveForSlot(action.fighterId, action.slot)
  const cast = pageCast(page, action, move?.auraCost)
  return castHatsu(withBook, cast)
}

function useBlinkyPage(state: CombatState, action: FightingMoveAction): CombatState {
  return resolveFightingBlinky(state, {
    ...action,
    fighterId: 'shizuku',
    slot: 'neutralSpecial',
  })
}

function pageCast(page: string, action: FightingMoveAction, cost = 24): HatsuCast {
  const { effect, zone } = pageProfile(page)
  return {
    side: action.side,
    effect,
    zone,
    hatsuId: page,
    cost,
  }
}

function pageProfile(page: string): { effect: ArenaHatsuEffect; zone: BodyZone } {
  if (['black-voice', 'order-stamp', 'chain-jail', 'cross-game'].includes(page))
    return { effect: 'bind', zone: 'arms' }
  if (['double-machine-gun', 'dance-of-the-serpents-bite'].includes(page))
    return { effect: 'barrage', zone: 'torso' }
  if (['holy-chain', 'nen-stitches', 'erigeron'].includes(page))
    return { effect: 'restore', zone: 'torso' }
  if (['convert-hands', 'parallel-future', 'biohazard-hinrigh'].includes(page))
    return { effect: 'enhance', zone: 'arms' }
  return { effect: 'impact', zone: 'torso' }
}

function canHandleBook(state: CombatState, action: FightingMoveAction): boolean {
  const fighter = state[action.side]
  const move = moveForSlot(action.fighterId, action.slot)
  return Boolean(
    move &&
    fighter.mode !== 'zetsu' &&
    fighter.condition === 'ready' &&
    fighter.cooldown <= 0 &&
    !fighter.intent &&
    fighter.aura >= move.auraCost,
  )
}

function spendUtility(
  state: CombatState,
  action: FightingMoveAction,
  book: ArenaSkillHunterBook,
): CombatState {
  const fighter = state[action.side]
  const move = moveForSlot(action.fighterId, action.slot)!
  const cooldown = (move.tuning.startup + move.tuning.active + move.tuning.recovery) / 60
  return {
    ...putBook(state, action.side, book),
    [action.side]: {
      ...fighter,
      skillHunterBook: book,
      aura: fighter.aura - move.auraCost,
      cooldown,
      movement: [0, 0],
    },
  }
}

function putBook(
  state: CombatState,
  side: CombatSide,
  skillHunterBook: ArenaSkillHunterBook,
): CombatState {
  return { ...state, [side]: { ...state[side], skillHunterBook } }
}

function releaseStolenPage(state: CombatState, owner: CombatSide): CombatState {
  return {
    ...state,
    nenEffects: state.nenEffects.filter(
      (effect) => effect.id !== `skill-hunter-${owner}` || effect.owner !== owner,
    ),
  }
}
