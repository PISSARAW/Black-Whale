import type { ArcadeFighter, FightNenZone, FightSide, FightState } from './types'

export const LEORIO_SONAR_COST = 10
export const LEORIO_SONAR_REVEAL_FRAMES = 120
export const LEORIO_SONAR_SCAN_FRAMES = 480
export const LEORIO_TEN_CHIP_FACTOR = 2.2
export const LEORIO_TEN_LAUNCH_Y = 0.2
export const LEORIO_TEN_LAUNCH_VY = 0.35

declare module './types' {
  interface ArcadeFighter {
    sonarRevealFrames?: number
    sonarScanFrames?: number
    sonarTargetLimb?: Extract<FightNenZone, 'hands' | 'feet'>
  }
}

/** Legacy entry point. Leorio has shown remote emission through a surface, not a Nen sonar. */
export function castLeorioSonar(state: FightState, side: FightSide): FightState {
  void side
  return state
}

export function advanceLeorioSonar(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const f = next[side]
    if (!f.sonarRevealFrames && !f.sonarScanFrames) continue
    const sonarRevealFrames = Math.max(0, (f.sonarRevealFrames ?? 0) - 1) || undefined
    const sonarScanFrames = Math.max(0, (f.sonarScanFrames ?? 0) - 1) || undefined
    next = {
      ...next,
      [side]: {
        ...f,
        sonarRevealFrames,
        sonarScanFrames,
        sonarTargetLimb: sonarScanFrames ? f.sonarTargetLimb : undefined,
      },
    }
  }
  return next
}

/** Remote Punch has no attested property that bypasses ordinary Nen defence. */
export function leorioBreaksTenGuard(
  attacker: ArcadeFighter,
  defender: ArcadeFighter,
  blocked: boolean,
): boolean {
  void attacker
  void defender
  void blocked
  return false
}

/** Leorio has no attested combat scan that accelerates Body Memory. */
export function leorioSurgicalStack(attacker: ArcadeFighter, defender: ArcadeFighter): number {
  void attacker
  void defender
  return 1
}
