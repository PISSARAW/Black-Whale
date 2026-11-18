import { sunMoonStrikeHandReady, sunMoonStrikeMark } from '../sunMoonStrikeHands'
import { plantBlackVoice } from '../blackVoice'
import { advanceBlackVoice } from '../blackVoiceFrame'
import {
  chrolloNenActive,
  chrolloPageForMove,
  chrolloSourceFor,
  CHROLLO_STEAL,
} from '../chrolloBook'
import { reconcileChrolloPages } from '../chrolloPageEffects'
import { completeSkillHunter } from '../skillHunterAcquisition'
import { advanceHistoricalEffects } from '../chrolloHistoricalEffects'
import { advanceHistoricalCopies } from '../chrolloHistoricalObjects'
import { advanceGallerySenses } from '../gallerySense'
import type { ArcadeFighter, FightSide, FightState } from '../types'
import { unchangedTrigger, type FighterHatsu, type HatsuImpactContext } from './contract'

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
    if (page === 'black-voice') return plantBlackVoice(context)
    return page === 'sun-and-moon' ? stamp(context) : context.state
  },
  onFrame: (state) =>
    advanceGallerySenses(
      advanceHistoricalCopies(
        advanceBlackVoice(
          advanceHistoricalEffects(advanceBook(advanceBook(state, 'player'), 'opponent')),
        ),
      ),
    ),
}

function steal({ state, side, defenderSide }: HatsuImpactContext): FightState {
  if (defenderSide === side) return state
  return completeSkillHunter(state, side)
}

function stamp(context: HatsuImpactContext): FightState {
  const { state, side, defenderSide, moveId } = context
  if (!sunMoonStrikeHandReady(state, side, moveId)) return state
  const moon = sunMoonStrikeMark(state[side], moveId) === 'moon'
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
  return state
}
