import { advanceAttackBuffer } from './attackBuffer'
import { THROW_TECH_FRAMES } from './throwRules'
import { attackAuraCost } from './fightAttackCost'
import { interruptUnavailableNen } from './nenActionRules'
import { illumiBodyFree } from './illumiState'
import { machiImmobilized } from './machiThread'
import { battlePreparing } from './battleCantabileRules'
import { biohazardBodyFree } from './biohazard'
import { crossGameBusy } from './crossGame'
import { predatorNenLocked } from './predatorSeal'
import { melodyRestrictsCombat } from './melodyRules'
import { thetaPhysicalShot } from './thetaFirearm'
import { remotePunchAvailable } from './leorioAttack'
import { chrolloMoveAvailable } from './chrolloBook'
import { kurapikaMoveAvailable } from './kurapika'
import { benjaminMoveAvailable } from './benjaminBaton'
import { feitanMoveAvailable } from './feitanPain'
import { projectionPreparing } from './hanzoProjection'
import { canCancel } from './duelMoves'
import { attackData, attackTotal, INPUT_BUFFER_FRAMES } from './frameData'
import { canUseFightHatsu, hatsuSourceFor } from './hatsu'
import { focusAttackRyu, releaseFocusedAura, setIn } from './nen'
import { canUseRangedAttack } from './projectiles'
import { hasMoveResources, moveById } from './movesets'
import type { ArcadeFighter, AttackKind, AttackVariant, FighterId } from './types'

const MIN_X = 7
const MAX_X = 93

export function advanceFighterAttack(fighter: ArcadeFighter): ArcadeFighter {
  fighter = advanceAttackBuffer(interruptUnavailableNen(fighter))
  if (!fighter.attack) return fighter
  const data = attackData(fighter.attack.kind, fighter)
  const frame = fighter.attack.frame + 1
  let next: ArcadeFighter = {
    ...fighter,
    attack: { ...fighter.attack, frame },
  }
  if (!fighter.attack.impacted && frame >= data.startup + data.active) {
    next = setIn(releaseFocusedAura(next), false)
  }
  return frame >= attackTotal(data)
    ? {
        ...setIn(releaseFocusedAura(next), false),
        attack: null,
        hatsuChargeFrames: 0,
      }
    : next
}

export function startFighterAttack(options: {
  fighter: ArcadeFighter
  kind: AttackKind
  auraCharged: boolean
  concealed: boolean
  variant?: AttackVariant
  moveId?: string
  hatsuSource?: FighterId | null
  auraCost?: number
}): ArcadeFighter {
  const { fighter, kind, auraCharged, concealed } = options
  const data = attackData(kind, {
    ...fighter,
    attack: {
      ...fighter.attack!,
      kind,
      variant: options.variant,
      moveId: options.moveId,
    },
  })
  const usesRyu = wantsAttackRyu(fighter)
  const focused = attackRyu(fighter, kind)
  const prepared = concealed ? setIn(focused, true) : focused
  return {
    ...prepared,
    nen: { ...prepared.nen, en: null },
    x: clamp(fighter.x + fighter.facing * data.lunge, MIN_X, MAX_X),
    aura:
      fighter.aura -
      (options.auraCost ?? attackAuraCost({ fighter, kind, moveId: options.moveId, concealed })),
    pose: kind,
    blocking: false,
    guardFrames: 0,
    wakeupInvulnerableFrames: 0,
    throwTechFrames: options.variant === 'throw' ? THROW_TECH_FRAMES : fighter.throwTechFrames,
    ryuWindow: usesRyu ? 10 : fighter.ryuWindow,
    hatsuChargeFrames: 0,
    attack: {
      moveId: options.moveId,
      kind,
      variant: options.variant,
      confirmedHit: false,
      frame: 0,
      impacted: false,
      auraCharged: auraCharged && canChargeAura(fighter, kind),
      concealed,
      hatsuSource: attackHatsuSource(options),
      projectileSpawned: false,
      reversal: fighter.reversalWindow > 0,
    },
    bufferedAttack: null,
  }
}

function attackHatsuSource(options: Parameters<typeof startFighterAttack>[0]): FighterId | null {
  return options.kind === 'special'
    ? (options.hatsuSource ?? hatsuSourceFor(options.fighter, options.moveId))
    : null
}

export function canStartFighterAttack(
  fighter: ArcadeFighter,
  kind: AttackKind,
  moveId?: string,
): boolean {
  return illumiBodyFree(fighter) && ordinaryCanStartFighterAttack(fighter, kind, moveId)
}

function ordinaryCanStartFighterAttack(
  fighter: ArcadeFighter,
  kind: AttackKind,
  moveId?: string,
): boolean {
  if (fighter.pluggingWounds || fighter.throwTechRecoveryFrames) return false
  if (fighterTechniqueBusy(fighter)) return false
  if (fighter.parallelEyesClosed || !characterAttackAvailable(fighter, kind, moveId)) return false
  if (!biohazardBodyFree(fighter)) return false
  const resourceReady = hasAttackResources(fighter, kind, moveId)
  return (
    canAct(fighter) &&
    (fighter.attack === null || cancelReady(fighter, kind, moveId)) &&
    resourceReady
  )
}

function characterAttackAvailable(
  fighter: ArcadeFighter,
  kind: AttackKind,
  moveId?: string,
): boolean {
  if (fighter.id === 'theta' && kind === 'special') return false
  if (!kurapikaMoveAvailable(fighter, moveId)) return false
  if (kind === 'special' && !chrolloMoveAvailable(fighter, moveId)) return false
  if (attackRestricted(fighter, kind, moveId)) return false
  return true
}

function attackRestricted(fighter: ArcadeFighter, kind: AttackKind, moveId?: string): boolean {
  if (!remotePunchAvailable(fighter, kind, moveId) || projectionPreparing(fighter)) return true
  if (fighter.hanzoProjection && kind === 'ranged') return true
  return (
    kind === 'special' &&
    (!benjaminMoveAvailable(fighter, moveId) || !feitanMoveAvailable(fighter, moveId))
  )
}

export function canBufferFighterAttack(fighter: ArcadeFighter): boolean {
  return illumiBodyFree(fighter) && ordinaryCanBufferFighterAttack(fighter)
}

function ordinaryCanBufferFighterAttack(fighter: ArcadeFighter): boolean {
  if (fighter.pluggingWounds) return false
  if (fighterTechniqueBusy(fighter)) return false
  const remainingStun = Math.max(
    fighter.hitStun,
    fighter.blockStun,
    fighter.knockdownFrames,
    fighter.throwTechRecoveryFrames ?? 0,
  )
  if (remainingStun > 0) return remainingStun <= INPUT_BUFFER_FRAMES
  if (!fighter.attack) return false
  const remaining = attackTotal(attackData(fighter.attack.kind, fighter)) - fighter.attack.frame
  return remaining <= INPUT_BUFFER_FRAMES
}

function canAct(fighter: ArcadeFighter): boolean {
  if (fighter.easterEgg) return false
  return (
    !machiImmobilized(fighter) &&
    fighter.hitStun === 0 &&
    fighter.blockStun === 0 &&
    fighter.knockdownFrames === 0 &&
    fighter.health > 0 &&
    !fighter.throwTechRecoveryFrames
  )
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function cancelReady(fighter: ArcadeFighter, kind: AttackKind, moveId?: string): boolean {
  if (!canCancel(fighter, kind, moveId) || !fighter.attack) return false
  const data = attackData(fighter.attack.kind, fighter)
  const window = moveById(fighter.attack.moveId)?.cancelWindow
  return (
    (!window || fighter.attack.frame >= data.startup + window.start) &&
    fighter.attack.frame <= data.cancelEnd
  )
}

function hasAttackResources(fighter: ArcadeFighter, kind: AttackKind, moveId?: string): boolean {
  const move = moveById(moveId)
  return move
    ? hasMoveResources(fighter, move)
    : kind === 'special'
      ? canUseFightHatsu(fighter)
      : kind !== 'ranged' || canUseRangedAttack(fighter)
}

function canChargeAura(fighter: ArcadeFighter, kind: AttackKind): boolean {
  return (
    fighter.nen.mode !== 'zetsu' &&
    !thetaPhysicalShot(fighter, kind) &&
    !predatorNenLocked(fighter) &&
    !(fighter.id === 'musse' && kind === 'ranged')
  )
}

function wantsAttackRyu(fighter: ArcadeFighter): boolean {
  return !fighter.nen.ko && (fighter.blocking || fighter.ryuWindow > 0)
}

function attackRyu(fighter: ArcadeFighter, kind: AttackKind): ArcadeFighter {
  const focused = Object.values(fighter.nen.ryu).some((share) => Number(share) > 0)
  return wantsAttackRyu(fighter) && !focused ? focusAttackRyu(fighter, kind) : fighter
}

function fighterTechniqueBusy(fighter: ArcadeFighter): boolean {
  return (
    Boolean(fighter.preparationRecovery) ||
    Boolean(fighter.pluggingWounds) ||
    Boolean(fighter.cyclotronWindup) ||
    crossGameBusy(fighter) ||
    melodyRestrictsCombat(fighter) ||
    battlePreparing(fighter) ||
    !biohazardBodyFree(fighter)
  )
}
