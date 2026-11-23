import { transitionNen } from '@black-whale/nen-engine'
import { EXHAUSTION_RELEASE_AURA } from './nen'
import { onOf } from './onTechnique'
import { canSpeak } from './saiyuSenses'
import type { ArcadeFighter, FightInput, FightState } from './types'

export type SeiyakuKind = 'speed' | 'aggression' | 'blind'

export const SEIYAKU_SPEED_FRAMES = 600 // 10 s
export const SEIYAKU_AGGRESSION_FRAMES = 480 // 8 s
export const SEIYAKU_AGGRESSION_BACK_LIMIT = 10
export const SEIYAKU_AGGRESSION_SEAL_FRAMES = 180 // 3 s
export const SEIYAKU_AGGRESSION_POWER = 1.25
export const SEIYAKU_BLIND_COST_FACTOR = 0.75

export interface SeiyakuState {
  kind: SeiyakuKind
  /** Remaining frames; null means active for the whole round ('blind'). */
  remainingFrames: number | null
  backHoldFrames: number
  breached: boolean
}

declare module './types' {
  interface ArcadeFighter {
    seiyaku?: SeiyakuState
    zetsuReleaseThreshold?: number
  }
}

/** Swears a Soft-Lock Seiyaku: never disables any button, punishes panic breaches immediately. */
export function swearSeiyaku(fighter: ArcadeFighter, kind: SeiyakuKind): ArcadeFighter {
  if (!canSpeak(fighter)) return fighter
  if (fighter.seiyaku && !fighter.seiyaku.breached) return fighter
  const remainingFrames =
    kind === 'speed'
      ? SEIYAKU_SPEED_FRAMES
      : kind === 'aggression'
        ? SEIYAKU_AGGRESSION_FRAMES
        : null
  return {
    ...fighter,
    seiyaku: { kind, remainingFrames, backHoldFrames: 0, breached: false },
  }
}

export function seiyakuSpeedActive(fighter: ArcadeFighter): boolean {
  return Boolean(fighter.seiyaku?.kind === 'speed' && !fighter.seiyaku.breached)
}

export function seiyakuHatsuPowerFactor(fighter: ArcadeFighter): number {
  return fighter.seiyaku?.kind === 'aggression' && !fighter.seiyaku.breached
    ? SEIYAKU_AGGRESSION_POWER
    : 1
}

export function seiyakuHatsuCostFactor(fighter: ArcadeFighter): number {
  return fighter.seiyaku?.kind === 'blind' && !fighter.seiyaku.breached
    ? SEIYAKU_BLIND_COST_FACTOR
    : 1
}

export function seiyakuExhaustionThreshold(fighter: ArcadeFighter): number {
  return fighter.zetsuReleaseThreshold ?? EXHAUSTION_RELEASE_AURA
}

export function holdingBack(fighter: ArcadeFighter, input?: FightInput): boolean {
  if (!input) return false
  return fighter.facing === 1 ? input.left && !input.right : input.right && !input.left
}

export function holdingForward(fighter: ArcadeFighter, input?: FightInput): boolean {
  if (!input) return false
  return fighter.facing === 1 ? input.right && !input.left : input.left && !input.right
}

/**
 * Aura + Context (+ direction) swears a Soft-Lock Seiyaku:
 * - Neutral / Down -> 'speed' (1f transfer, no Ken)
 * - Forward -> 'aggression' (+25% Hatsu power, no retreat > 10f)
 * - Back / Up -> 'blind' (-25% Hatsu cost, no Gyo)
 */
export function resolveSeiyakuInput(
  fighter: ArcadeFighter,
  input?: FightInput,
): ArcadeFighter {
  if (!input?.aura || !input.context) return fighter
  const kind: SeiyakuKind = holdingForward(fighter, input)
    ? 'aggression'
    : holdingBack(fighter, input) || input.jump
      ? 'blind'
      : 'speed'
  return swearSeiyaku(fighter, kind)
}

function breachSeiyaku(fighter: ArcadeFighter, kind: SeiyakuKind): ArcadeFighter {
  const breached: SeiyakuState = { ...fighter.seiyaku!, breached: true, remainingFrames: 0 }
  if (kind === 'speed') {
    const zetsu = transitionNen(fighter.nen, { type: 'ZETSU' }).state
    return { ...fighter, seiyaku: breached, nen: zetsu, aura: 0, auraExhausted: true }
  }
  if (kind === 'aggression') {
    const on = onOf(fighter)
    return {
      ...fighter,
      seiyaku: breached,
      on: { ...on, sealFrames: Math.max(on.sealFrames, SEIYAKU_AGGRESSION_SEAL_FRAMES) },
    }
  }
  return {
    ...fighter,
    seiyaku: breached,
    zetsuReleaseThreshold: EXHAUSTION_RELEASE_AURA * 2,
  }
}

function stepFighterSeiyaku(fighter: ArcadeFighter, input?: FightInput): ArcadeFighter {
  const vow = fighter.seiyaku
  if (!vow || vow.breached) return fighter
  if (vow.kind === 'speed' && fighter.nen.ken) return breachSeiyaku(fighter, 'speed')
  if (vow.kind === 'blind' && fighter.nen.gyo) return breachSeiyaku(fighter, 'blind')
  const backHoldFrames =
    vow.kind === 'aggression' && holdingBack(fighter, input) ? vow.backHoldFrames + 1 : 0
  if (vow.kind === 'aggression' && backHoldFrames > SEIYAKU_AGGRESSION_BACK_LIMIT) {
    return breachSeiyaku(fighter, 'aggression')
  }
  if (vow.remainingFrames === null) return fighter
  const remaining = vow.remainingFrames - 1
  if (remaining <= 0) return { ...fighter, seiyaku: undefined }
  return { ...fighter, seiyaku: { ...vow, remainingFrames: remaining, backHoldFrames } }
}

export function advanceSeiyaku(
  state: FightState,
  inputs: { player: FightInput; opponent?: FightInput },
): FightState {
  if (state.phase !== 'fighting') return state
  const swornPlayer = resolveSeiyakuInput(state.player, inputs.player)
  const swornOpponent = resolveSeiyakuInput(state.opponent, inputs.opponent)
  const player = stepFighterSeiyaku(swornPlayer, inputs.player)
  const opponent = stepFighterSeiyaku(swornOpponent, inputs.opponent)
  if (player === state.player && opponent === state.opponent) return state
  return { ...state, player, opponent }
}
