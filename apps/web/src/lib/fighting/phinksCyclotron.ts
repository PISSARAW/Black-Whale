import { voluntaryNenAvailable } from './nenAccess'
import { chrolloHasActivePage } from './chrolloBook'
import { hatsuSourceFor } from './hatsu'
import { applyAuraContext } from './nen'
import { canStartFighterAttack } from './fighterAttacks'
import type { AttackFrameData } from './frameData'
import type { ArcadeFighter, AttackKind, FightInput } from './types'

/** Duel tuning, not a canonical cadence, aura price or damage formula. */
export interface PhinksStrikeEvidence {
  frame: number
  turns: number
  ken: boolean
  ten?: boolean
  ren?: boolean
  ko?: boolean
}

export const CYCLOTRON_ROTATION_FRAMES = 36
export const CYCLOTRON_ROTATION_AURA = 2
export const CYCLOTRON_PUNCH = 'phinks:finisher'
/** Step-in of a combo release (phinksComboRelease.ts): covers the carry of the blow it cancels. */
export const CYCLOTRON_COMBO_LUNGE = 4

export function cyclotronNenActive(fighter: ArcadeFighter): boolean {
  return voluntaryNenAvailable(fighter, { requireReserve: true }) && cyclotronOwned(fighter)
}

function cyclotronOwned(fighter: ArcadeFighter): boolean {
  if (fighter.kurapika?.held?.used && fighter.kurapika.held.source === 'phinks') return true
  if (fighter.id === 'chrollo') return chrolloHasActivePage(fighter, 'phinks')
  return hatsuSourceFor(fighter) === 'phinks'
}

export function cyclotronCanAct(fighter: ArcadeFighter): boolean {
  return (
    cyclotronNenActive(fighter) &&
    fighter.y === 0 &&
    !fighter.attack &&
    !fighter.chainJail &&
    !fighter.drainingChain &&
    canStartFighterAttack({ ...fighter, cyclotronWindup: undefined }, 'light')
  )
}

/** Incomplete turns are discarded. Completed turns wait for the dedicated right punch. */
export function pauseCyclotron(fighter: ArcadeFighter): ArcadeFighter {
  return { ...fighter, cyclotronWindup: undefined }
}

export function holdCyclotron(fighter: ArcadeFighter): ArcadeFighter {
  return {
    ...fighter,
    pose: 'idle',
    blocking: false,
    crouching: false,
    guardFrames: 0,
    motion: undefined,
    velocityY: 0,
    bufferedAttack: null,
    hatsuChargeFrames: 0,
    wakeupInvulnerableFrames: 0,
    reversalWindow: 0,
    ryuWindow: 0,
  }
}

export function clearCyclotron(fighter: ArcadeFighter): ArcadeFighter {
  return {
    ...pauseCyclotron(fighter),
    hatsuEffects: { ...fighter.hatsuEffects, cyclotronTurns: 0 },
    attack: fighter.attack && { ...fighter.attack, cyclotronTurns: undefined },
  }
}

/**
 * Rotation en mouvement (Dix tours, un poing, signatureCombosBiscuitPhinks.ts): the right arm
 * keeps turning while Phinks moves, crouches, jumps and lands ordinary blows. Guard, a hit
 * taken, a hold, a throw, a technique or the release stop it. The blows gain nothing from it.
 */
export function cyclotronKeepsTurning(fighter: ArcadeFighter): boolean {
  if (!cyclotronNenActive(fighter) || fighter.blocking || cyclotronBodyHeld(fighter)) return false
  return !fighter.attack || cyclotronAllowsAttack(fighter, fighter.attack.kind, fighter.attack)
}

function cyclotronBodyHeld(fighter: ArcadeFighter): boolean {
  return Boolean(
    fighter.hitStun ||
    fighter.knockdownFrames ||
    fighter.blockStun ||
    fighter.chainJail ||
    fighter.drainingChain,
  )
}

/** While winding, only ordinary blows and the release may start; never a throw or a technique. */
export function cyclotronAllowsAttack(
  fighter: ArcadeFighter,
  kind: AttackKind,
  attack?: { variant?: string; moveId?: string },
): boolean {
  if (!fighter.cyclotronWindup || attack?.moveId === CYCLOTRON_PUNCH) return true
  return (kind === 'light' || kind === 'heavy') && attack?.variant !== 'throw'
}

/** Advances once per simulated frame; hitstop and pause never complete a rotation. */
export function advanceCyclotron(fighter: ArcadeFighter): ArcadeFighter {
  if (!cyclotronBusy(fighter)) return fighter
  if (!cyclotronNenActive(fighter)) return clearCyclotron(fighter)
  const windup = fighter.cyclotronWindup
  if (!windup) return fighter
  if (!cyclotronKeepsTurning(fighter)) return pauseCyclotron(fighter)
  const frame = windup.frame + 1
  if (frame < CYCLOTRON_ROTATION_FRAMES) return { ...fighter, cyclotronWindup: { frame } }
  if (fighter.aura < CYCLOTRON_ROTATION_AURA) return pauseCyclotron(fighter)
  return {
    ...fighter,
    aura: fighter.aura - CYCLOTRON_ROTATION_AURA,
    hatsuEffects: {
      ...fighter.hatsuEffects,
      cyclotronTurns: fighter.hatsuEffects.cyclotronTurns + 1,
    },
    cyclotronWindup: { frame: 0 },
  }
}

export function cyclotronBusy(fighter: ArcadeFighter): boolean {
  return Boolean(
    fighter.cyclotronWindup ||
    fighter.hatsuEffects.cyclotronTurns ||
    fighter.attack?.cyclotronTurns,
  )
}

/** Basic Nen controls may interrupt winding; movement goes on (rotation en mouvement). */
export function steerCyclotron(fighter: ArcadeFighter, input?: FightInput): ArcadeFighter | null {
  if (!fighter.cyclotronWindup) return null
  const next = input ? applyAuraContext(fighter, input) : fighter
  return cyclotronNenActive(next) ? null : clearCyclotron(next)
}

export function cyclotronPunchReady(fighter: ArcadeFighter): boolean {
  return cyclotronCanAct(fighter) && fighter.hatsuEffects.cyclotronTurns > 0
}

/** Only this attack's captured charge changes this fist's frame data. Never a global buff. */
export function cyclotronAttackData(
  data: AttackFrameData,
  fighter: ArcadeFighter,
): AttackFrameData {
  const turns = fighter.attack?.cyclotronTurns ?? 0
  if (turns <= 0 || fighter.attack?.kind !== 'special' || !cyclotronNenActive(fighter)) return data
  return {
    ...data,
    startup: 14,
    active: 5,
    recovery: 24,
    damage: Math.round(18 * (1 + turns * 0.25)),
    hitstun: 25,
    blockstun: 14,
    hitstop: 8,
    knockback: 5,
    lunge: fighter.attack?.accel ? CYCLOTRON_COMBO_LUNGE : 0,
    targetZone: 'torso',
    auraZone: 'hands',
    cancelEnd: 0,
    box: { left: 0, right: 12, bottom: 3, top: 11 },
  }
}
