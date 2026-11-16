import {
  addChrolloPage,
  chrolloHasActivePage,
  chrolloNenActive,
  chrolloPageForMove,
  chrolloSourceFor,
  CHROLLO_SECONDARY,
  CHROLLO_STEAL,
  type ChrolloPage,
} from '../chrolloBook'
import { reconcileChrolloPages } from '../chrolloPageEffects'
import type { ArcadeFighter, FightSide, FightState } from '../types'
import { unchangedTrigger, type FighterHatsu, type HatsuImpactContext } from './contract'

const BLACK_VOICE_FRAMES = 90
const SUN_MOON_DAMAGE = 24

/** Pages and bookmark follow ch. 351. Acquisition dialogue and stamp contact are duel abstractions. */
export const chrolloHatsu: FighterHatsu = {
  id: 'chrollo',
  sourceFor: chrolloSourceFor,
  onTrigger: unchangedTrigger,
  onImpact: (context) => {
    if (context.blocked) return context.state
    if (context.moveId === CHROLLO_STEAL) return steal(context)
    const page = chrolloPageForMove(context.state[context.side], context.moveId)
    if (page === 'black-voice') return blackVoice(context)
    return page === 'sun-and-moon' ? stamp(context) : context.state
  },
  onFrame: (state) => advanceBook(advanceBook(state, 'player'), 'opponent'),
}

function steal({ state, side, defenderSide }: HatsuImpactContext): FightState {
  const thief = state[side]
  const victim = state[defenderSide]
  const seen = thief.hatsuEffects.witnessedHatsu === victim.id
  const book = thief.chrolloBook
  if (!book || !seen || !stealableVictim(victim)) return state
  const next = {
    ...state,
    [side]: {
      ...thief,
      chrolloBook: addChrolloPage(book, victim.id as ChrolloPage),
      hatsuEffects: { ...thief.hatsuEffects, stolenHatsu: victim.id },
    },
    [defenderSide]: { ...victim, hatsuEffects: { ...victim.hatsuEffects, hatsuStolen: 1 } },
  }
  return reconcileChrolloPages(state, next, side)
}

function stealableVictim(victim: ArcadeFighter): boolean {
  // Bodily changes, basic Nen and abilities requiring no usable Hatsu are not pages.
  return (
    victim.health > 0 &&
    victim.id !== 'chrollo' &&
    victim.id !== 'theta' &&
    victim.hatsuEffects.hatsuStolen === 0
  )
}

function blackVoice({ state, defenderSide }: HatsuImpactContext): FightState {
  const target = state[defenderSide]
  return {
    ...state,
    [defenderSide]: {
      ...target,
      hitStun: Math.max(target.hitStun, 12),
      hatsuEffects: { ...target.hatsuEffects, manipulatedFrames: BLACK_VOICE_FRAMES },
    },
  }
}

function stamp(context: HatsuImpactContext): FightState {
  const { state, side, defenderSide, moveId } = context
  const owner = state[side]
  // H uses the free left hand while the book is held, the right hand once closed.
  const moon = moveId === CHROLLO_SECONDARY && !owner.chrolloBook?.open
  const target = state[defenderSide]
  const mark = moon ? 'moonMark' : 'sunMark'
  const marked = { ...target, hatsuEffects: { ...target.hatsuEffects, [mark]: 1 } }
  return { ...state, [defenderSide]: detonate(marked) }
}

function detonate(target: ArcadeFighter): ArcadeFighter {
  if (target.hatsuEffects.sunMark === 0 || target.hatsuEffects.moonMark === 0) return target
  return {
    ...target,
    health: Math.max(0, target.health - SUN_MOON_DAMAGE),
    hitStun: Math.max(target.hitStun, 38),
    hatsuEffects: { ...target.hatsuEffects, sunMark: 0, moonMark: 0 },
  }
}

function advanceBook(state: FightState, side: FightSide): FightState {
  const owner = state[side]
  if (owner.id !== 'chrollo' || !owner.chrolloBook) return state
  if (!chrolloNenActive(owner)) {
    const dismissed = {
      ...state,
      [side]: { ...owner, chrolloBook: { ...owner.chrolloBook, open: false, bookmark: null } },
    }
    return reconcileChrolloPages(state, dismissed, side)
  }
  return chrolloHasActivePage(owner, 'black-voice') ? orderRetreat(state, side) : state
}

/** A planted antenna gives a concrete order. Range/duration are competitive tuning. */
function orderRetreat(state: FightState, side: FightSide): FightState {
  const targetSide = side === 'player' ? 'opponent' : 'player'
  const target = state[targetSide]
  const frames = target.hatsuEffects.manipulatedFrames
  if (frames <= 0) return state
  const direction = target.x >= state[side].x ? 1 : -1
  return {
    ...state,
    [targetSide]: {
      ...target,
      x: Math.max(7, Math.min(93, target.x + direction * 0.3)),
      hitStun: Math.max(target.hitStun, 2),
      blocking: false,
      attack: null,
      bufferedAttack: null,
      hatsuEffects: { ...target.hatsuEffects, manipulatedFrames: frames - 1 },
    },
  }
}
