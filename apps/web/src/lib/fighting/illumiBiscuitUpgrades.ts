import { isBiscuitTrueForm } from './biscuitForm'
import type { ArcadeFighter, FightInput, FightState } from './types'

export const ILLUMI_NEEDLE_ORDER_FRAMES = 240 // 4 s
export const ILLUMI_NEEDLE_REMOVE_STUN = 14
export const BISCUIT_TRUE_FORM_RYU_SHARE = 0.8
export const BISCUIT_CARE_FATIGUE_FACTOR = 0.55

export type IllumiNeedleOrderKind = 'retreat' | 'zetsu'

export interface IllumiNeedleOrder {
  order: IllumiNeedleOrderKind
  remainingFrames: number
}

declare module './types' {
  interface ArcadeFighter {
    illumiNeedleOrder?: IllumiNeedleOrder
  }
  interface FightInput {
    removeNeedle?: boolean
  }
}

/** Illumi 5S/6S: implants a 4s motor parasite ('retreat' or 'zetsu') instead of full stun. */
export function implantIllumiNeedleOrder(
  target: ArcadeFighter,
  order: IllumiNeedleOrderKind,
): ArcadeFighter {
  return {
    ...target,
    illumiNeedleOrder: { order, remainingFrames: ILLUMI_NEEDLE_ORDER_FRAMES },
  }
}

export function hasIllumiNeedleOrder(fighter: ArcadeFighter): boolean {
  return Boolean(fighter.illumiNeedleOrder && fighter.illumiNeedleOrder.remainingFrames > 0)
}

/** Parasites the victim's commands without locking the controller. */
export function applyIllumiMotorParasite(fighter: ArcadeFighter, input: FightInput): FightInput {
  const order = fighter.illumiNeedleOrder?.order
  if (!order) return input
  if (order === 'retreat') {
    const pressingForward = fighter.facing === 1 ? input.right && !input.left : input.left && !input.right
    const reversedMove = pressingForward
      ? { left: !input.left, right: !input.right }
      : { left: input.left, right: input.right }
    const swapKo = input.guard && input.aura
    return {
      ...input,
      ...reversedMove,
      jump: swapKo ? input.down : input.jump,
      down: swapKo ? input.jump : input.down,
    }
  }
  // 'zetsu' order blocks Ken (guard + aura) and Ren (aura without down) until needle is pulled.
  if (input.aura && !input.down) return { ...input, aura: false }
  return input
}

/** Context button (`removeNeedle`) pulls the needle out, leaving a brief punishable opening. */
export function removeIllumiNeedle(fighter: ArcadeFighter): ArcadeFighter {
  if (!fighter.illumiNeedleOrder) return fighter
  return {
    ...fighter,
    illumiNeedleOrder: undefined,
    hitStun: Math.max(fighter.hitStun, ILLUMI_NEEDLE_REMOVE_STUN),
  }
}

/** Biscuit 2S: reversible switch between agile girl form (2f transfer) and true muscular form. */
export function toggleBiscuitForm(fighter: ArcadeFighter): ArcadeFighter {
  if ((fighter.nenOwner ?? fighter.id) !== 'biscuit') return fighter
  return { ...fighter, biscuitTrueForm: !fighter.biscuitTrueForm }
}

/** Biscuit's true form over-optimizes Ryu focus (80% instead of 72%). */
export function biscuitRyuFocusShare(fighter: ArcadeFighter): number {
  return isBiscuitTrueForm(fighter) ? BISCUIT_TRUE_FORM_RYU_SHARE : 0.72
}

/** Cookie-chan / Piano Massage: clears mental fatigue and eases Body Memory between rounds. */
export function applyBiscuitInterRoundCare(fighter: ArcadeFighter): ArcadeFighter {
  if ((fighter.nenOwner ?? fighter.id) !== 'biscuit') return fighter
  const nenMentalFatigue = Math.round((fighter.nenMentalFatigue ?? 0) * BISCUIT_CARE_FATIGUE_FACTOR)
  const hits = fighter.bodyMemory?.hits
  const healedHits = hits
    ? {
        hands: Math.max(0, (hits.hands ?? 0) - 1),
        feet: Math.max(0, (hits.feet ?? 0) - 1),
      }
    : undefined
  return {
    ...fighter,
    nenMentalFatigue,
    bodyMemory: healedHits ? { hits: healedHits } : fighter.bodyMemory,
  }
}

export function advanceIllumiBiscuitUpgrades(state: FightState): FightState {
  if (state.phase !== 'fighting') return state
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const f = next[side]
    if (!f.illumiNeedleOrder) continue
    const remaining = f.illumiNeedleOrder.remainingFrames - 1
    next = {
      ...next,
      [side]: {
        ...f,
        illumiNeedleOrder: remaining > 0 ? { ...f.illumiNeedleOrder, remainingFrames: remaining } : undefined,
      },
    }
  }
  return next
}
