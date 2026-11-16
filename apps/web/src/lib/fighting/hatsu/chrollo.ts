import type { ArcadeFighter, FightState } from '../types'
import { unchangedTrigger, type FighterHatsu, type HatsuImpactContext } from './contract'

const BLACK_VOICE_FRAMES = 90
const SUN_MOON_DAMAGE = 24
const SUN_MOON_HITSTUN = 38
const SKILL_HUNTER_MOVE = 'chrollo:neutralSpecial'

type ChrolloStrike = (context: HatsuImpactContext) => FightState

/**
 * Chrollo — Skill Hunter and the pages it holds.
 *
 * Each technique is a different page, so each move carries its own rule:
 * - Skill Hunter (neutral special) steals an ability Chrollo has watched being
 *   activated, by pressing its user onto the book; while held, the owner loses
 *   it. Once a page is held, the same move replays it. The canon question and
 *   answer cannot be played in a duel and are left out (gameplay abstraction).
 * - Black Voice (forward special) controls only the target its antenna strikes.
 * - Sun and Moon (down / back special, finisher) stamp one mark each; only the
 *   pair, once both marks meet, explodes.
 */
const STRIKES: Partial<Record<string, ChrolloStrike>> = {
  [SKILL_HUNTER_MOVE]: steal,
  'chrollo:forwardSpecial': blackVoice,
  'chrollo:downSpecial': (context) => stamp(context, 'sunMark'),
  'chrollo:backSpecial': (context) => stamp(context, 'moonMark'),
  'chrollo:finisher': completePair,
}

export const chrolloHatsu: FighterHatsu = {
  id: 'chrollo',
  sourceFor: (fighter, moveId) =>
    moveId === SKILL_HUNTER_MOVE ? (fighter.hatsuEffects.stolenHatsu ?? 'chrollo') : 'chrollo',
  onTrigger: unchangedTrigger,
  onImpact: (context) => {
    const strike = context.moveId ? STRIKES[context.moveId] : undefined
    return context.blocked || !strike ? context.state : strike(context)
  },
  onFrame: (state) => ({
    ...state,
    player: tickBlackVoice(state.player),
    opponent: tickBlackVoice(state.opponent),
  }),
}

function steal({ state, side, defenderSide }: HatsuImpactContext): FightState {
  const thief = state[side]
  const victim = state[defenderSide]
  const seen = thief.hatsuEffects.witnessedHatsu === victim.id
  const stealable = victim.id !== 'chrollo' && victim.hatsuEffects.hatsuStolen === 0
  if (!seen || !stealable || thief.hatsuEffects.stolenHatsu) return state
  return {
    ...state,
    [side]: { ...thief, hatsuEffects: { ...thief.hatsuEffects, stolenHatsu: victim.id } },
    [defenderSide]: { ...victim, hatsuEffects: { ...victim.hatsuEffects, hatsuStolen: 1 } },
  }
}

function blackVoice({ state, defenderSide }: HatsuImpactContext): FightState {
  const target = state[defenderSide]
  return {
    ...state,
    [defenderSide]: {
      ...target,
      hitStun: Math.max(target.hitStun, BLACK_VOICE_FRAMES / 2),
      hatsuEffects: { ...target.hatsuEffects, manipulatedFrames: BLACK_VOICE_FRAMES },
    },
  }
}

function stamp(context: HatsuImpactContext, mark: 'sunMark' | 'moonMark'): FightState {
  const { state, defenderSide } = context
  const target = state[defenderSide]
  const marked = { ...target, hatsuEffects: { ...target.hatsuEffects, [mark]: 1 } }
  return { ...state, [defenderSide]: detonate(marked) }
}

function completePair(context: HatsuImpactContext): FightState {
  const effects = context.state[context.defenderSide].hatsuEffects
  return stamp(context, effects.sunMark > 0 ? 'moonMark' : 'sunMark')
}

function detonate(target: ArcadeFighter): ArcadeFighter {
  if (target.hatsuEffects.sunMark === 0 || target.hatsuEffects.moonMark === 0) return target
  return {
    ...target,
    health: Math.max(0, target.health - SUN_MOON_DAMAGE),
    hitStun: Math.max(target.hitStun, SUN_MOON_HITSTUN),
    hatsuEffects: { ...target.hatsuEffects, sunMark: 0, moonMark: 0 },
  }
}

function tickBlackVoice(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.manipulatedFrames
  if (frames <= 0) return fighter
  return {
    ...fighter,
    hitStun: Math.max(fighter.hitStun, 2),
    hatsuEffects: { ...fighter.hatsuEffects, manipulatedFrames: frames - 1 },
  }
}
