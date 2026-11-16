import { chrolloHasActivePage } from './chrolloBook'
import { hatsuSourceFor } from './hatsu'
import { hatsuSealedByOn } from './onTechnique'
import { applyAuraContext } from './nen'
import { canStartFighterAttack } from './fighterAttacks'
import type { AttackFrameData } from './frameData'
import type { ArcadeFighter, FightInput } from './types'

/** Duel tuning, not a canonical cadence, aura price or damage formula. */
export const CYCLOTRON_ROTATION_FRAMES = 36
export const CYCLOTRON_ROTATION_AURA = 2
export const CYCLOTRON_PUNCH = 'phinks:finisher'

export function cyclotronNenActive(fighter: ArcadeFighter): boolean {
  return (
    fighter.health > 0 &&
    fighter.aura > 0 &&
    !fighter.auraExhausted &&
    fighter.nen.mode !== 'zetsu' &&
    !hatsuSealedByOn(fighter) &&
    fighter.hatsuEffects.forcedZetsuFrames === 0 &&
    fighter.hatsuEffects.hatsuStolen === 0 &&
    cyclotronOwned(fighter)
  )
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

/** Advances once per simulated frame; hitstop and pause never complete a rotation. */
export function advanceCyclotron(fighter: ArcadeFighter): ArcadeFighter {
  if (!cyclotronBusy(fighter)) return fighter
  if (!cyclotronNenActive(fighter)) return clearCyclotron(fighter)
  const windup = fighter.cyclotronWindup
  if (!windup) return fighter
  if (!cyclotronCanAct(fighter)) return pauseCyclotron(fighter)
  const frame = windup.frame + 1
  if (frame < CYCLOTRON_ROTATION_FRAMES)
    return { ...holdCyclotron(fighter), cyclotronWindup: { frame } }
  if (fighter.aura < CYCLOTRON_ROTATION_AURA) return pauseCyclotron(fighter)
  return {
    ...holdCyclotron(fighter),
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

/** Basic Nen controls may interrupt winding; movement and ordinary guard cannot coexist with it. */
export function steerCyclotron(fighter: ArcadeFighter, input?: FightInput): ArcadeFighter | null {
  if (!fighter.cyclotronWindup) return null
  const next = input ? applyAuraContext(fighter, input) : fighter
  return cyclotronNenActive(next) ? holdCyclotron(next) : clearCyclotron(next)
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
    lunge: 0,
    targetZone: 'torso',
    auraZone: 'hands',
    cancelEnd: 0,
    box: { left: 0, right: 12, bottom: 3, top: 11 },
  }
}
