import { attackPhase } from './frameData'
import { styleReactionFrames } from './styleMobility'
import type { ArsenalAiContext, ArsenalAiPlan } from './arsenalAiTypes'
import type { ArcadeFighter, FighterId } from './types'

const AERIAL_PLANS: ReadonlySet<FighterId> = new Set([
  'cluck',
  'musse',
  'hinrigh',
  'longhi',
  'voconte',
  'furykov',
  'beyond',
  'padaille',
  'lynch',
  'rihan',
  'basho',
  'bonolenov',
  'halkenburg',
  'bill',
  'yokotani',
  'melody',
  'saiyu',
  'zakuro',
  'gel',
  'illumi',
  'machi',
  'luini',
  'theta',
  'tserriednich',
  'leorio',
  'hanzo',
  'kurapika',
  'hisoka',
  'benjamin',
  'biscuit',
  'franklin',
])

const PLANS: Partial<Record<FighterId, ArsenalAiPlan>> = {
  mizaistom: ({ gap, roll }) =>
    gap < 7
      ? ['standingLight', 'lowHeavy']
      : roll < 0.6
        ? ['forwardLight', 'backHeavy']
        : ['forwardHeavy', 'standingLight'],
  terebellum: ({ gap, roll, state }) => {
    if (state.opponent.ryuWindow > 0) return ['standingHeavy', 'standingLight']
    if (gap <= 5 && roll < 0.29) return ['throw', 'standingLight', 'lowHeavy']
    return gap <= 8 ? ['lowLight', 'standingHeavy'] : ['forwardLight', 'forwardHeavy']
  },
  cluck: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airHeavy', 'airLight']
    if (gap < 8) return roll < 0.55 ? ['backHeavy', 'standingLight'] : ['lowHeavy', 'standingLight']
    return roll < 0.54 ? ['forwardLight', 'standingLight'] : ['forwardHeavy', 'standingHeavy']
  },
  sayird: ({ gap, roll, state }) => {
    if (visibleRecovery(state.player)) return ['forwardLight', 'standingHeavy']
    if (gap < 7) return roll < 0.45 ? ['lowLight', 'standingLight'] : ['backHeavy', 'standingHeavy']
    return ['forwardLight', 'backHeavy']
  },
  camilla: ({ gap, roll, state }) => {
    if (visibleRecovery(state.player)) return ['backHeavy', 'standingLight']
    if (gap < 8) return roll < 0.35 ? ['lowLight', 'standingLight'] : ['backHeavy', 'standingLight']
    return ['standingLight', 'backHeavy']
  },
  musse: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airLight', 'airHeavy']
    if (visibleRecovery(state.player)) return ['forwardLight', 'standingHeavy']
    return gap < 8 && roll < 0.5
      ? ['lowLight', 'standingHeavy']
      : ['backHeavy', 'standingLight', 'forwardHeavy']
  },
  hinrigh: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airHeavy', 'airLight']
    if (gap < 6 && roll < 0.3) return ['throw', 'standingLight']
    return gap < 9 ? ['standingLight', 'lowHeavy'] : ['forwardLight', 'forwardHeavy']
  },
  longhi: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airLight', 'airHeavy']
    if (visibleRecovery(state.player)) return ['forwardHeavy', 'standingHeavy']
    return gap < 8 && roll < 0.55 ? ['backHeavy', 'lowHeavy'] : ['standingLight', 'lowLight']
  },
  voconte: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airHeavy', 'airLight']
    if (visibleRecovery(state.player)) return ['forwardHeavy', 'forwardLight']
    return gap < 8 && roll < 0.6 ? ['standingHeavy', 'lowLight'] : ['forwardLight', 'backHeavy']
  },
  furykov: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airLight', 'airHeavy']
    if (visibleRecovery(state.player)) return ['forwardHeavy', 'standingHeavy']
    return gap < 9 && roll < 0.55 ? ['standingLight', 'lowLight'] : ['forwardLight', 'backHeavy']
  },
  beyond: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airHeavy', 'airLight']
    if (gap < 6 && roll < 0.28) return ['throw', 'standingHeavy']
    return gap < 9
      ? ['standingHeavy', 'standingLight', 'lowHeavy']
      : ['forwardHeavy', 'forwardLight']
  },
  padaille: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airHeavy', 'airLight']
    if (visibleRecovery(state.player)) return ['standingHeavy', 'forwardHeavy']
    return gap < 8 && roll < 0.5 ? ['lowLight', 'standingLight'] : ['forwardLight', 'backHeavy']
  },
  lynch: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airLight', 'airHeavy']
    if (state.opponent.lynchQuestion)
      return gap < 9 ? ['standingLight', 'standingHeavy'] : ['forwardLight']
    return gap < 8 && roll < 0.52 ? ['lowLight', 'standingHeavy'] : ['forwardLight', 'forwardHeavy']
  },
  rihan: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airLight', 'airHeavy']
    if (visibleRecovery(state.player)) return ['backHeavy', 'forwardLight']
    return gap < 8 && roll < 0.5 ? ['standingLight', 'lowHeavy'] : ['lowLight', 'forwardHeavy']
  },
  basho: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airLight', 'airHeavy']
    if (state.opponent.bashoPoem?.ready && gap < 10) return ['standingLight', 'standingHeavy']
    if (visibleRecovery(state.player)) return ['backHeavy', 'forwardLight']
    return gap < 8 && roll < 0.58 ? ['standingLight', 'lowLight'] : ['forwardHeavy', 'forwardLight']
  },
  bonolenov: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airHeavy', 'airLight']
    if (gap < 8) return roll < 0.46 ? ['standingLight', 'lowHeavy'] : ['standingHeavy', 'backHeavy']
    return ['forwardLight', 'forwardHeavy']
  },
  halkenburg: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airLight', 'airHeavy']
    if (visibleRecovery(state.player)) return ['forwardHeavy', 'standingHeavy']
    return gap < 8 && roll < 0.5 ? ['backHeavy', 'lowLight'] : ['standingLight', 'forwardLight']
  },
  bill: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airLight', 'airHeavy']
    if (gap <= 6 && roll < 0.25) return ['throw', 'standingLight']
    return gap < 9
      ? ['standingLight', 'standingHeavy', 'lowHeavy']
      : ['forwardLight', 'forwardHeavy']
  },
  yokotani: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airHeavy', 'airLight']
    if (visibleRecovery(state.player)) return ['forwardHeavy', 'standingHeavy']
    return gap < 8 && roll < 0.56 ? ['standingLight', 'standingHeavy'] : ['lowLight', 'backHeavy']
  },
  melody: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airLight', 'airHeavy']
    if (visibleRecovery(state.player)) return ['backHeavy', 'forwardLight']
    return gap < 8 && roll < 0.45 ? ['standingHeavy', 'lowLight'] : ['standingLight', 'backHeavy']
  },
  saiyu: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airLight', 'airHeavy']
    if (visibleRecovery(state.player)) return ['forwardLight', 'standingHeavy']
    return gap < 8 && roll < 0.55 ? ['standingLight', 'lowHeavy'] : ['forwardLight', 'backHeavy']
  },
  zakuro: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airHeavy', 'airLight']
    if (gap < 6 && roll < 0.25) return ['throw', 'standingLight']
    return gap < 8 ? ['standingHeavy', 'lowLight'] : ['forwardLight', 'backHeavy']
  },
  gel: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airHeavy', 'airLight']
    if (visibleRecovery(state.player)) return ['standingHeavy', 'forwardHeavy']
    return gap < 8 && roll < 0.45 ? ['lowLight', 'standingLight'] : ['backHeavy', 'forwardLight']
  },
  illumi: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airLight', 'airHeavy']
    if (visibleRecovery(state.player)) return ['forwardLight', 'standingLight']
    return gap < 8 && roll < 0.55
      ? ['standingLight', 'standingHeavy']
      : ['backHeavy', 'forwardHeavy']
  },
  machi: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airHeavy', 'airLight']
    if (visibleRecovery(state.player)) return ['backHeavy', 'forwardLight']
    return gap < 8 && roll < 0.48
      ? ['standingLight', 'standingHeavy']
      : ['forwardLight', 'lowHeavy']
  },
  luini: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airLight', 'airHeavy']
    if (visibleRecovery(state.player)) return ['forwardLight', 'forwardHeavy']
    return gap < 8 && roll < 0.45 ? ['standingLight', 'lowLight'] : ['backHeavy', 'forwardLight']
  },
  theta: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airHeavy', 'airLight']
    if (visibleRecovery(state.player)) return ['forwardLight', 'standingHeavy']
    return gap < 8 && roll < 0.58 ? ['standingLight', 'backHeavy'] : ['lowLight', 'forwardHeavy']
  },
  tserriednich: ({ gap, state }) => {
    if (state.opponent.y > 0) return ['airHeavy', 'airLight']
    if (visibleRecovery(state.player)) return ['standingHeavy', 'forwardHeavy']
    return gap < 8 ? ['standingLight', 'lowLight'] : ['backHeavy', 'forwardLight']
  },
  leorio: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airLight', 'airHeavy']
    if (gap < 6 && roll < 0.24) return ['throw', 'standingLight']
    return gap < 8
      ? ['standingLight', 'standingHeavy', 'lowHeavy']
      : ['forwardHeavy', 'forwardLight']
  },
  hanzo: ({ gap, roll, state }) => {
    if (state.opponent.y > 0) return ['airHeavy', 'airLight']
    if (visibleRecovery(state.player)) return ['forwardHeavy', 'forwardLight']
    return gap < 7 && roll < 0.5
      ? ['standingLight', 'standingHeavy']
      : ['forwardLight', 'backHeavy']
  },
  kurapika: ({ gap, state }) => {
    if (state.opponent.y > 0) return ['airLight', 'airHeavy']
    return gap < 8 ? ['standingLight', 'standingHeavy'] : ['forwardLight', 'backHeavy']
  },
  hisoka: ({ gap, state }) => {
    if (state.opponent.y > 0) return ['airHeavy', 'airLight']
    return gap < 8 ? ['standingLight', 'lowHeavy'] : ['backHeavy', 'forwardHeavy']
  },
  benjamin: ({ gap, state }) => {
    if (state.opponent.y > 0) return ['airLight', 'airHeavy']
    return gap < 8 ? ['standingHeavy', 'standingLight'] : ['forwardHeavy', 'forwardLight']
  },
  biscuit: ({ gap, state }) => {
    if (state.opponent.y > 0) return ['airLight', 'airHeavy']
    if (state.opponent.biscuitTrueForm) return ['standingHeavy', 'forwardHeavy']
    return gap < 7 ? ['standingLight', 'lowLight'] : ['backHeavy', 'forwardLight']
  },
  franklin: ({ gap, state }) => {
    if (state.opponent.y > 0) return ['airHeavy', 'airLight']
    return gap < 9 ? ['standingLight', 'lowHeavy'] : ['forwardLight', 'standingHeavy']
  },
}

export function physicalAttackSlots(context: ArsenalAiContext) {
  const plan = PLANS[context.state.opponent.id]
  if (context.state.opponent.y > 0 && !AERIAL_PLANS.has(context.state.opponent.id)) return undefined
  return plan?.(context)
}

export function cluckApproachJump(fighter: ArcadeFighter, target: ArcadeFighter): boolean {
  if (fighter.id !== 'cluck' || Math.abs(fighter.x - target.x) < 13) return false
  return Boolean(
    visibleRecovery(target) &&
    (target.attack?.frame ?? 0) >= styleReactionFrames(fighter) &&
    Math.abs(fighter.x - target.x) <= 22,
  )
}

function visibleRecovery(target: ArcadeFighter): boolean {
  return Boolean(target.attack && !target.attack.concealed && attackPhase(target) === 'recovery')
}
