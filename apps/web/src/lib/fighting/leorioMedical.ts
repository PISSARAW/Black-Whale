import { voluntaryNenAvailable } from './nenAccess'
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

const isLeorio = (fighter: Pick<ArcadeFighter, 'id' | 'nenOwner'>) =>
  (fighter.nenOwner ?? fighter.id) === 'leorio'

function mostHitLimb(fighter: ArcadeFighter): Extract<FightNenZone, 'hands' | 'feet'> {
  const hands = fighter.bodyMemory?.hits.hands ?? 0
  const feet = fighter.bodyMemory?.hits.feet ?? 0
  return feet > hands ? 'feet' : 'hands'
}

/** 2S Medical Sonar: reveals Zetsu/In for 2s without En's defense penalty and scans anatomy for 8s. */
export function castLeorioSonar(state: FightState, side: FightSide): FightState {
  const caster = state[side]
  if (!isLeorio(caster) || caster.y > 0 || !voluntaryNenAvailable(caster)) return state
  if (caster.aura < LEORIO_SONAR_COST) return state
  const targetSide: FightSide = side === 'player' ? 'opponent' : 'player'
  const target = state[targetSide]
  return {
    ...state,
    [side]: { ...caster, aura: caster.aura - LEORIO_SONAR_COST },
    [targetSide]: {
      ...target,
      sonarRevealFrames: LEORIO_SONAR_REVEAL_FRAMES,
      sonarScanFrames: LEORIO_SONAR_SCAN_FRAMES,
      sonarTargetLimb: mostHitLimb(target),
    },
  }
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

/** Remote Punch breaks ordinary Ten guard; only Ken or Defensive Ko (feet) blocks it cleanly. */
export function leorioBreaksTenGuard(
  attacker: ArcadeFighter,
  defender: ArcadeFighter,
  blocked: boolean,
): boolean {
  if (!blocked || !isLeorio(attacker)) return false
  const moveId = attacker.attack?.moveId
  const isRemote =
    attacker.attack?.kind === 'special' &&
    (!moveId || moveId === 'leorio:neutralSpecial' || moveId === 'leorio:forwardSpecial')
  if (!isRemote) return false
  return !defender.nen.ken && defender.nen.ko !== 'feet'
}

/** Surgical strike: scanned targets take double Body Memory stacks (2 clean hits instead of 3). */
export function leorioSurgicalStack(attacker: ArcadeFighter, defender: ArcadeFighter): number {
  return isLeorio(attacker) && (defender.sonarScanFrames ?? 0) > 0 ? 2 : 1
}
