import type { ArcadeFighter, FightSide, FightState } from './types'

export const MACHI_SUTURE_AURA_COST = 15
export const MACHI_TRIPWIRE_HITSTUN = 14
export const MACHI_PULL_STEP = 14
export const PHINKS_STORED_TURNS_FRAMES = 180
export const PHINKS_OVERDRIVE_THRESHOLD = 10
export const FRANKLIN_KEN_GUARD_DRAIN = 0
export const FRANKLIN_SUPPRESSION_AURA = 4
export const FRANKLIN_HEAVY_SALVO_AURA = 14

export interface MachiTripwire {
  owner: FightSide
  x: number
  active: boolean
}

export interface FranklinSalvoProfile {
  auraCost: number
  keepsHitstun: boolean
  breaksRenAdvance: boolean
  cancelsWeakerProjectiles: boolean
}

declare module './types' {
  interface ArcadeFighter {
    machiTrackedBy?: FightSide
    phinksStoredTurnsFrames?: number
  }
  interface FightState {
    machiTripwire?: MachiTripwire
  }
}

/** Machi can close open wounds with thread, but sutures do not erase accumulated limb strain. */
export function applyMachiCombatSuture(fighter: ArcadeFighter): ArcadeFighter {
  if (fighter.aura < MACHI_SUTURE_AURA_COST) return fighter
  return {
    ...fighter,
    aura: fighter.aura - MACHI_SUTURE_AURA_COST,
    openWounds: 0,
  }
}

/** Machi 4S: lays an In-concealed tripwire in the arena (invisible without full ocular Gyo). */
export function placeMachiInTripwire(state: FightState, side: FightSide): FightState {
  const machi = state[side]
  const x = Math.max(8, Math.min(92, machi.x + machi.facing * 10))
  return { ...state, machiTripwire: { owner: side, x, active: true } }
}

export function machiTripwireVisibleTo(state: FightState, observer: FightSide): boolean {
  const wire = state.machiTripwire
  if (!wire?.active) return false
  if (observer === wire.owner) return true
  const viewer = state[observer]
  return Boolean(viewer.nen.gyo && !viewer.gyoLow)
}

/** Machi plants a physical tracking thread without changing the target's aura state. */
export function plantMachiTrackingThread(state: FightState, side: FightSide): FightState {
  const targetSide: FightSide = side === 'player' ? 'opponent' : 'player'
  const target = state[targetSide]
  return {
    ...state,
    [targetSide]: {
      ...target,
      machiTrackedBy: side,
    },
  }
}

/** Machi 6S: consumes the tracking thread to yank the opponent toward Machi once. */
export function pullMachiTrackedTarget(state: FightState, side: FightSide): FightState {
  const targetSide: FightSide = side === 'player' ? 'opponent' : 'player'
  const machi = state[side]
  const target = state[targetSide]
  if (target.machiTrackedBy !== side) return state
  const direction = machi.x > target.x ? 1 : -1
  const nextX = Math.max(7, Math.min(93, target.x + direction * MACHI_PULL_STEP))
  return {
    ...state,
    [targetSide]: {
      ...target,
      x: nextX,
      machiTrackedBy: undefined,
      hitStun: Math.max(target.hitStun, 10),
    },
  }
}

/** Phinks under In hides his Ripper Cyclotron rotation count (`null` -> `?` on opponent HUD). */
export function phinksDisplayedTurns(
  phinks: ArcadeFighter,
  observer: ArcadeFighter,
): number | null {
  const turns = phinks.hatsuEffects.cyclotronTurns
  if (phinks.nen.in && !(observer.nen.gyo && !observer.gyoLow)) return null
  return turns
}

/** Cancelling Ripper Cyclotron loses the incomplete charge. */
export function cancelCyclotronWithStorage(fighter: ArcadeFighter): ArcadeFighter {
  return {
    ...fighter,
    cyclotronWindup: undefined,
    hatsuEffects: { ...fighter.hatsuEffects, cyclotronTurns: 0 },
    phinksStoredTurnsFrames: undefined,
  }
}

/** Ripper Cyclotron has no demonstrated automatic recoil threshold. */
export function applyPhinksRecoil(fighter: ArcadeFighter, turns: number): ArcadeFighter {
  void turns
  return fighter
}

/** Franklin's bullets use the ordinary Ken contact rules without an extra aura drain. */
export function franklinKenDrain(
  attacker: ArcadeFighter,
  defender: ArcadeFighter,
  blocked: boolean,
): number {
  void attacker
  void defender
  void blocked
  return 0
}

/** Franklin 5S (suppression) vs 6S (heavy two-hand salvo pushing Ren & cancelling weaker shots). */
export function franklinSalvoProfile(variant?: 'neutral' | 'forward'): FranklinSalvoProfile {
  if (variant === 'forward') {
    return {
      auraCost: FRANKLIN_HEAVY_SALVO_AURA,
      keepsHitstun: false,
      breaksRenAdvance: true,
      cancelsWeakerProjectiles: true,
    }
  }
  return {
    auraCost: FRANKLIN_SUPPRESSION_AURA,
    keepsHitstun: true,
    breaksRenAdvance: false,
    cancelsWeakerProjectiles: false,
  }
}

function stepMachiTripwire(state: FightState): FightState {
  const wire = state.machiTripwire
  if (!wire?.active) return state
  const targetSide: FightSide = wire.owner === 'player' ? 'opponent' : 'player'
  const target = state[targetSide]
  const crossing = Math.abs(target.x - wire.x) <= 2.5
  const movingFast = target.y > 0 || Boolean(target.motion)
  if (!crossing || !movingFast) return state
  return {
    ...state,
    machiTripwire: undefined,
    [targetSide]: {
      ...target,
      openWounds: (target.openWounds ?? 0) + 1,
      velocityY: 0,
      motion: undefined,
      hitStun: Math.max(target.hitStun, MACHI_TRIPWIRE_HITSTUN),
    },
  }
}

export function advanceTroupeUpgrades(state: FightState): FightState {
  if (state.phase !== 'fighting') return state
  let next = stepMachiTripwire(state)
  for (const side of ['player', 'opponent'] as const) {
    const f = next[side]
    if (!f.phinksStoredTurnsFrames) continue
    const remaining = f.phinksStoredTurnsFrames - 1
    next = {
      ...next,
      [side]:
        remaining > 0
          ? { ...f, phinksStoredTurnsFrames: remaining }
          : {
              ...f,
              phinksStoredTurnsFrames: undefined,
              hatsuEffects: { ...f.hatsuEffects, cyclotronTurns: 0 },
            },
    }
  }
  return next
}
