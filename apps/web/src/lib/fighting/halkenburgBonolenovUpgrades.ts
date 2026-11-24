import { canSpeak } from './saiyuSenses'
import type { ArcadeFighter, FighterId, FightSide, FightState } from './types'

export const HALKENBURG_SWAP_FRAMES = 360 // 6 s
export const HALKENBURG_GUARD_TRANSFER_FRAMES = 6
export const JUPITER_ACOUSTIC_FRAMES = 240 // 4 s
export const JUPITER_TRANSFER_PENALTY = 0

declare module './types' {
  interface ArcadeFighter {
    halkenburgSwappedFrames?: number
    halkenburgSleepingBodyX?: number
    jupiterAcousticFrames?: number
    vocalExchangeReady?: boolean
    metamorphosenCopiedId?: FighterId
  }
}

/** Halkenburg 6S (charged Grimmel arrow): pierces Ten, Ken, and defensive Ko. */
export function isHalkenburgUnblockableArrow(attacker: ArcadeFighter): boolean {
  return (
    (attacker.nenOwner ?? attacker.id) === 'halkenburg' &&
    attacker.attack?.kind === 'special' &&
    attacker.attack.moveId === 'halkenburg:forwardSpecial'
  )
}

/** Legacy entry point. The persistent exchange is handled by the Halkenburg soul system. */
export function applyHalkenburgBodySwap(state: FightState, halkenburgSide: FightSide): FightState {
  void halkenburgSide
  return state
}

export function halkenburgHatsuLocked(fighter: ArcadeFighter): boolean {
  return fighter.hatsuEffects.possessedFrames > 0
}

/** Jupiter has no demonstrated generic Nen-transfer penalty. */
export function applyJupiterAcousticImpact(
  target: ArcadeFighter,
  coveringEars: boolean,
): ArcadeFighter {
  void coveringEars
  return target
}

/** Bonolenov Metamorphosen requires both speech (blocked by Iwazaru) and a vocal `call` exchange. */
export function canUseMetamorphosen(bonolenov: ArcadeFighter): boolean {
  return canSpeak(bonolenov) && Boolean(bonolenov.vocalExchangeReady)
}

export function recordVocalExchange(fighter: ArcadeFighter): ArcadeFighter {
  return { ...fighter, vocalExchangeReady: true }
}

export function activateMetamorphosen(state: FightState, side: FightSide): FightState {
  const bono = state[side]
  if (!canUseMetamorphosen(bono)) return state
  const foe = state[side === 'player' ? 'opponent' : 'player']
  return {
    ...state,
    [side]: { ...bono, metamorphosenCopiedId: foe.id },
  }
}

export function advanceHalkenburgBonolenovUpgrades(state: FightState): FightState {
  if (state.phase !== 'fighting') return state
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const f = next[side]
    const swap = Math.max(0, (f.halkenburgSwappedFrames ?? 0) - 1) || undefined
    const jupiter = Math.max(0, (f.jupiterAcousticFrames ?? 0) - 1) || undefined
    if (swap !== f.halkenburgSwappedFrames || jupiter !== f.jupiterAcousticFrames) {
      next = {
        ...next,
        [side]: {
          ...f,
          halkenburgSwappedFrames: swap,
          halkenburgSleepingBodyX: swap ? f.halkenburgSleepingBodyX : undefined,
          jupiterAcousticFrames: jupiter,
        },
      }
    }
  }
  return next
}
