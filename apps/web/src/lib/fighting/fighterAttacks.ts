import { interruptHanzoBlade } from './hanzoBlade'
import { cyclotronAllowsAttack } from './phinksCyclotron'
import { beginAttackDrive, advanceAttackDrive } from './fightAttackAdvance'
import { nextNenBranchCount } from './nenPreparedBranches'
import { enDuringAttack } from './en/access'
import { newGumSource } from './bungeeSource'
import { openingFollowup } from './comboOpenings'
import { accelStart } from './accelCancel'
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
import { bodyguardPhysicalShot } from './bodyguardFirearms'
import { hinrighBlocksHandAction } from './hinrighZakuroLuiniUpgrades'
import { remotePunchAvailable } from './leorioAttack'
import { chrolloMoveAvailable, chrolloRightHandOccupied } from './chrolloBook'
import { EN_STARTUP_BONUS } from './nenPillars'
import { chainsImmobilize, kurapikaMoveAvailable } from './kurapika'
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
import {
  directionalSourceMatches,
  isAirPursuit,
  pursuitWindow,
  type DirectionalChain,
  type DirectionalIntent,
} from './directionalChain'
import { pursuitTakeoff } from './fighterMovement'
import { followUpPhysicsFor } from './moveFollowUpPhysics'

export function advanceFighterAttack(fighter: ArcadeFighter): ArcadeFighter {
  fighter = advanceAttackBuffer(interruptUnavailableNen(interruptHanzoBlade(fighter)))
  if (!fighter.attack) return fighter
  const data = attackData(fighter.attack.kind, fighter)
  const frame = fighter.attack.frame + 1
  let next: ArcadeFighter = advanceAttackDrive(
    {
      ...fighter,
      attack: { ...fighter.attack, frame },
    },
    data.startup,
  )
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

/** An explicit cost (copied page, buffered cancel) wins over the move's own cost. */
function startingAuraCost(options: Parameters<typeof startFighterAttack>[0]): number {
  const { fighter, kind, moveId, concealed } = options
  return options.auraCost ?? attackAuraCost({ fighter, kind, moveId, concealed })
}

export function startFighterAttack(options: {
  fighter: ArcadeFighter
  kind: AttackKind
  auraCharged: boolean
  superThrow?: true
  concealed: boolean
  variant?: AttackVariant
  moveId?: string
  hatsuSource?: FighterId | null
  auraCost?: number
  directionalChain?: DirectionalChain
}): ArcadeFighter {
  const { fighter, kind, auraCharged, concealed } = options
  const comboFollowup = openingFollowup(fighter, options.moveId)
  const accel = accelStart(fighter, options.moveId)
  const data = attackData(kind, {
    ...fighter,
    attack: {
      ...fighter.attack!,
      superThrow: options.superThrow,
      kind,
      variant: options.variant,
      moveId: options.moveId,
      comboFollowup,
      directionalChain: options.directionalChain,
    },
  })
  const usesRyu = wantsAttackRyu(fighter)
  const focused = attackRyu(fighter, kind)
  const prepared = concealed ? setIn(focused, true) : focused
  return {
    ...prepared,
    nenOpening: undefined,
    nenBranchCount: nextNenBranchCount(fighter, options.moveId),
    nenConversionCount:
      (fighter.nenConversionCount ?? 0) +
      Number(nextNenBranchCount(fighter, options.moveId) > (fighter.nenBranchCount ?? 0)),
    ...takeoffFor(fighter, options.directionalChain, options.moveId),
    nen: { ...prepared.nen, en: enDuringAttack(prepared) },
    ...beginAttackDrive(fighter, { distance: data.lunge, immediate: options.variant === 'throw' }),
    aura: fighter.aura - startingAuraCost(options),
    pose: kind,
    blocking: false,
    guardFrames: 0,
    wakeupInvulnerableFrames: 0,
    throwTechFrames: throwTechFramesFor(fighter, options.variant),
    ryuWindow: usesRyu ? 10 : fighter.ryuWindow,
    hatsuChargeFrames: 0,
    ...accel.fighter,
    attack: {
      moveId: options.moveId,
      superThrow: options.superThrow,
      ...(comboFollowup ? { comboFollowup } : {}),
      ...accel.attack,
      ...(options.directionalChain ? { directionalChain: options.directionalChain } : {}),
      kind,
      variant: options.variant,
      confirmedHit: false,
      frame:
        fighter.enReflexActive && (kind === 'light' || kind === 'heavy') ? EN_STARTUP_BONUS : 0,
      impacted: false,
      auraCharged: auraCharged && canChargeAura(fighter, kind),
      concealed,
      hatsuSource: attackHatsuSource(options),
      nenOrigin: attackNenOrigin(options),
      illumiNeedleMode:
        attackHatsuSource(options) === 'illumi' ? fighter.illumiNeedleMode : undefined,
      projectileSpawned: false,
      reversal: fighter.reversalWindow > 0,
    },
    bufferedAttack: null,
  }
}

function throwTechFramesFor(fighter: ArcadeFighter, variant?: AttackVariant) {
  return variant === 'throw' ? THROW_TECH_FRAMES : fighter.throwTechFrames
}

function takeoffFor(fighter: ArcadeFighter, chain?: DirectionalChain, moveId?: string) {
  if (chain === 'pursuit' || (chain === 'pursuit-technique' && fighter.id === 'hisoka'))
    return pursuitTakeoff(fighter)
  const lift = followUpPhysicsFor(moveId)?.selfLiftVelocityY
  if (lift) return { y: Math.max(0.2, fighter.y), velocityY: Math.max(lift, fighter.velocityY) }
}

function attackNenOrigin(options: Parameters<typeof startFighterAttack>[0]) {
  const source = attackHatsuSource(options)
  return source === 'hisoka' || source === 'illumi' ? newGumSource(options.fighter) : undefined
}

function attackHatsuSource(options: Parameters<typeof startFighterAttack>[0]): FighterId | null {
  return options.kind === 'special'
    ? (options.hatsuSource ?? hatsuSourceFor(options.fighter, options.moveId))
    : null
}

export function canStartFighterAttack(
  fighter: ArcadeFighter,
  kind: AttackKind,
  destination?: string | DirectionalIntent,
): boolean {
  const intent = typeof destination === 'string' ? { moveId: destination } : (destination ?? {})
  return illumiBodyFree(fighter) && ordinaryCanStartFighterAttack(fighter, kind, intent)
}

function ordinaryCanStartFighterAttack(
  fighter: ArcadeFighter,
  kind: AttackKind,
  intent: DirectionalIntent,
): boolean {
  const { moveId } = intent
  if (fighter.pluggingWounds || fighter.throwTechRecoveryFrames) return false
  if ((fighter.firearmReloadFrames ?? 0) > 0) return false
  if (fighterTechniqueBusy(fighter)) return false
  if (fighter.parallelEyesClosed || !characterAttackAvailable(fighter, kind, moveId)) return false
  if (!biohazardBodyFree(fighter)) return false
  const resourceReady = hasAttackResources(fighter, kind, moveId)
  return (
    canAct(fighter) &&
    (fighter.attack === null ? !intent.directionalChain : cancelReady(fighter, kind, intent)) &&
    resourceReady
  )
}

function characterAttackAvailable(
  fighter: ArcadeFighter,
  kind: AttackKind,
  moveId?: string,
): boolean {
  if (fighter.id === 'theta' && kind === 'special') return false
  if (chainsImmobilize(fighter)) return false
  // Winding Phinks still strikes with ordinary blows (rotation en mouvement).
  if (!cyclotronAllowsAttack(fighter, kind, { moveId })) return false
  if (!bodyguardPhysicalShot(fighter, kind) && !kurapikaMoveAvailable(fighter, moveId)) return false
  if (kind === 'special' && !chrolloMoveAvailable(fighter, moveId)) return false
  if (chrolloRightHandOccupied(fighter) && moveById(moveId)?.category === 'throw') return false
  const zone = attackData(kind, fighter).auraZone
  const isThrow = moveById(moveId)?.category === 'throw'
  if (hinrighBlocksHandAction(fighter, isThrow ? 'throw' : kind, zone)) return false
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

const CHORD_LENIENCE_FRAMES = 3

function isChordOverride(fighter: ArcadeFighter, moveId?: string): boolean {
  const current = fighter.attack
  if (
    !current ||
    current.impacted ||
    current.frame > CHORD_LENIENCE_FRAMES ||
    current.accel ||
    current.kind === 'special'
  )
    return false
  const next = moveById(moveId)
  if (!next) return false
  if (next.category === 'throw') return current.kind === 'light' || current.kind === 'heavy'
  if (next.category === 'finisher') return current.kind === 'heavy'
  return false
}

function cancelReady(fighter: ArcadeFighter, kind: AttackKind, intent: DirectionalIntent): boolean {
  if (!fighter.attack) return false
  if (isChordOverride(fighter, intent.moveId)) return true
  if (!legalCancel(fighter, kind, intent)) return false
  const data = attackData(fighter.attack.kind, fighter)
  if (isAirPursuit(intent.directionalChain)) return pursuitWindow(fighter.attack.frame, data)
  const window = moveById(fighter.attack.moveId)?.cancelWindow
  return (
    (!window || fighter.attack.frame >= data.startup + window.start) &&
    fighter.attack.frame <= data.cancelEnd
  )
}

function legalCancel(fighter: ArcadeFighter, kind: AttackKind, intent: DirectionalIntent): boolean {
  const { directionalChain, moveId } = intent
  if (!directionalChain) return canCancel(fighter, kind, moveId)
  return Boolean(
    fighter.attack?.confirmedHit && directionalSourceMatches(fighter, directionalChain),
  )
}

function hasAttackResources(fighter: ArcadeFighter, kind: AttackKind, moveId?: string): boolean {
  if (kind === 'ranged' && !canUseRangedAttack(fighter)) return false
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
    !bodyguardPhysicalShot(fighter, kind) &&
    !predatorNenLocked(fighter)
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
    Boolean(fighter.halkSoulSleep) ||
    Boolean(fighter.luiniPassage) ||
    Boolean(fighter.preparationRecovery) ||
    Boolean(fighter.pluggingWounds) ||
    crossGameBusy(fighter) ||
    melodyRestrictsCombat(fighter) ||
    battlePreparing(fighter) ||
    !biohazardBodyFree(fighter)
  )
}
