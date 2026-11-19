import type { GuardRequirement } from './combatProperties'
import { openingFrameData } from './comboOpenings'
import { superThrowFrameData } from './superThrow'
import { paperUtilityAttack } from './kallutoPaper'
import { halkenburgArrowUtility } from './halkenburgArrow'
import { padailleUtilityAttack } from './padailleWeapon'
import { voconteUtilityCast } from './voconteDoors'
import { battleUtilityAttack } from './bonolenovMoveset'
import { LYNCH_MOVE } from './lynchTypes'
import { blinkyAttackData } from './blinkyAction'
import { blinkyUtilityAttack } from './blinky'
import { isMelodyMusicAttack } from './melodyRules'
import { secretWindowUtility } from './secretWindow'
import { comboMasterUtilityMove } from './comboMasterAvailability'
import { machiUtilityMove } from './machiThread'
import { cyclotronAttackData } from './phinksCyclotron'
import { isErigeronAttack } from './billSupport'
import { usesRemotePunch } from './leorioAttack'
import { chrolloUtilityMove, chrolloCopiedMove } from './chrolloBook'
import { isKurapikaUtility } from './kurapika'
import { dolphinActor } from './kurapika'
import { franklinAttackData, usesFranklinBarrage } from './franklinAttack'
import { benjaminRangedData } from './benjaminWeapon'
import { benjaminUtilityMove } from './benjaminBaton'
import { feitanUtilityMove } from './feitanPain'
import { hisokaUtilityMove } from './hisokaTechnique'
import { sleepingBody } from './hanzoProjection'
import { luiniHurtboxes } from './luiniPassage'
import { variantData } from './duelMoves'
import { fighterDefinition } from './roster'
import { directionalFrameData } from './directionalChain'
import { fightingStyle } from './fightStyles'
import { moveById } from './movesets'
import type { ArcadeFighter, AttackKind, AttackPhase, FightNenZone, FightSide } from './types'

export { FIGHT_FPS, FIXED_STEP, ROUND_FRAMES, INPUT_BUFFER_FRAMES } from './fightClock'

export interface FightBox {
  left: number
  right: number
  bottom: number
  top: number
}

export interface AttackFrameData {
  guard: GuardRequirement
  canHitDowned?: boolean
  reversalInvulnerableFrames?: number
  startup: number
  active: number
  recovery: number
  damage: number
  hitstun: number
  blockstun: number
  hitstop: number
  knockback: number
  lunge: number
  cancelEnd: number
  targetZone: FightNenZone
  auraZone: FightNenZone
  box: FightBox
}

const ATTACK_DATA: Record<AttackKind, AttackFrameData> = {
  light: {
    guard: 'mid',
    startup: 5,
    active: 3,
    recovery: 10,
    damage: 7,
    hitstun: 12,
    blockstun: 8,
    hitstop: 4,
    knockback: 1.8,
    lunge: 0.55,
    cancelEnd: 12,
    targetZone: 'head',
    auraZone: 'hands',
    box: { left: 1.7, right: 7.5, bottom: 5.2, top: 10.8 },
  },
  heavy: {
    guard: 'mid',
    startup: 12,
    active: 4,
    recovery: 18,
    damage: 12,
    hitstun: 18,
    blockstun: 12,
    hitstop: 10,
    knockback: 3,
    lunge: 0.9,
    cancelEnd: 24,
    targetZone: 'feet',
    auraZone: 'feet',
    box: { left: 1.4, right: 9.6, bottom: 1.2, top: 8.4 },
  },
  special: {
    guard: 'mid',
    startup: 16,
    active: 6,
    recovery: 28,
    damage: 19,
    hitstun: 26,
    blockstun: 18,
    hitstop: 12,
    knockback: 4.5,
    lunge: 1.2,
    cancelEnd: 50,
    targetZone: 'torso',
    auraZone: 'hands',
    box: { left: 1.5, right: 20, bottom: 3.4, top: 11.5 },
  },
  ranged: {
    guard: 'mid',
    startup: 10,
    active: 1,
    recovery: 17,
    damage: 0,
    hitstun: 0,
    blockstun: 0,
    hitstop: 0,
    knockback: 0,
    lunge: 0,
    cancelEnd: 28,
    targetZone: 'torso',
    auraZone: 'hands',
    box: { left: 0, right: 0, bottom: 0, top: 0 },
  },
}

export function attackData(kind: AttackKind, fighter: ArcadeFighter): AttackFrameData {
  fighter = dolphinActor(fighter)
  return superThrowFrameData(blinkyAttackData(
    cyclotronAttackData(franklinAttackData(baseAttackData(kind, fighter), fighter), fighter),
    fighter,
  ), fighter)
}

function baseAttackData(kind: AttackKind, fighter: ArcadeFighter): AttackFrameData {
  const move = moveById(frameMoveId(fighter))
  if (move)
    return blinkyAttackData(
      directionalFrameData(movesetAttackData(fighter, move), fighter.attack?.directionalChain),
      fighter,
    )
  const definition = fighterDefinition(fighter.id)
  const base = ATTACK_DATA[kind]
  const tuning = fightingStyle(fighter.id).attacks[kind]
  const nativeReach = attackReach(kind, definition.reach, definition.specialRange)
  return blinkyAttackData(
    benjaminRangedData(
      variantData({
        fighter,
        kind,
        data: {
          ...base,
          startup:
            scaledFrames(base.startup, tuning.startup) +
            (kind === 'special' && fighter.attack?.concealed ? 10 : 0),
          active: scaledFrames(base.active, tuning.active),
          recovery: scaledFrames(base.recovery, tuning.recovery),
          damage: scaledValue(base.damage, tuning.damage),
          hitstun: scaledFrames(base.hitstun, tuning.hitstun),
          blockstun: scaledFrames(base.blockstun, tuning.blockstun),
          knockback: scaledValue(base.knockback, tuning.knockback),
          lunge: scaledValue(base.lunge, tuning.lunge),
          targetZone: valueOr(tuning.targetZone, base.targetZone),
          auraZone: valueOr(tuning.auraZone, base.auraZone),
          box: {
            ...base.box,
            right: nativeReach + valueOr(tuning.reach, 0),
            bottom: valueOr(tuning.bottom, base.box.bottom),
            top: valueOr(tuning.top, base.box.top),
          },
        },
      }),
      fighter,
    ),
    fighter,
  )
}

function movesetAttackData(
  fighter: ArcadeFighter,
  move: NonNullable<ReturnType<typeof moveById>>,
): AttackFrameData {
  const data = move.tuning
  const startup = data.startup + (fighter.attack?.concealed ? 10 : 0)
  const antiAir = move.kind === 'heavy' && move.variant === 'standing'
  return openingFrameData(
    {
      ...data,
      guard: move.guard,
      canHitDowned: move.canHitDowned,
      reversalInvulnerableFrames: move.reversalInvulnerableFrames,
      startup,
      cancelEnd: move.cancelWindow
        ? startup + move.cancelWindow.end
        : data.startup + data.active + 6,
      box: {
        left: 1.4,
        right: data.reach,
        bottom: antiAir ? Math.min(2.4, data.bottom) : data.bottom,
        top: antiAir ? Math.max(15, data.top) : data.top,
      },
    },
    fighter.attack?.comboFollowup,
  )
}

function attackReach(kind: AttackKind, reach: number, specialRange: number): number {
  if (kind === 'special') return specialRange
  if (kind === 'ranged') return 0
  return kind === 'heavy' ? reach + 2 : reach
}

function scaledValue(value: number, scale?: number): number {
  return value * valueOr(scale, 1)
}

function valueOr<T>(value: T | undefined, fallback: T): T {
  return value === undefined ? fallback : value
}

function scaledFrames(value: number, scale = 1): number {
  return Math.max(1, Math.round(value * scale))
}

export function attackTotal(data: AttackFrameData): number {
  return data.startup + data.active + data.recovery
}

export function attackPhase(fighter: ArcadeFighter): AttackPhase | null {
  if (!fighter.attack) return null
  const data = attackData(fighter.attack.kind, fighter)
  const frame = fighter.attack.frame
  if (frame < data.startup) return 'startup'
  if (frame < data.startup + data.active) return 'active'
  return 'recovery'
}

export function attackProgress(fighter: ArcadeFighter): number {
  if (!fighter.attack) return 0
  return Math.min(1, fighter.attack.frame / attackTotal(attackData(fighter.attack.kind, fighter)))
}

export function activeHitbox(fighter: ArcadeFighter): FightBox | null {
  if (supplementaryUtility(fighter)) return null
  if (paperUtilityAttack(fighter)) return null
  if (blinkyUtilityAttack(fighter)) return null
  if (secretWindowUtility(fighter)) return null
  fighter = dolphinActor(fighter)
  if (utilityAttack(fighter)) return null
  if (!fighter.attack || fighter.attack.kind === 'ranged' || attackPhase(fighter) !== 'active')
    return null
  return worldBox(fighter, attackData(fighter.attack.kind, fighter).box)
}

function supplementaryUtility(fighter: ArcadeFighter): boolean {
  return Boolean(
    fighter.futureIllusionActive ||
    halkenburgArrowUtility(fighter) ||
    fighter.historicalWeaponThrow,
  )
}

function utilityAttack(fighter: ArcadeFighter): boolean {
  if (voconteUtilityCast(fighter)) return true
  return (
    battleUtilityAttack(fighter) ||
    fighter.attack?.moveId === LYNCH_MOVE ||
    [
      padailleUtilityAttack,
      machiUtilityMove,
      battleUtilityAttack,
      blinkyUtilityAttack,
      isMelodyMusicAttack,
      isErigeronAttack,
      comboMasterUtilityMove,
      chrolloUtilityMove,
      isKurapikaUtility,
      hisokaUtilityMove,
      usesFranklinBarrage,
      benjaminUtilityMove,
      feitanUtilityMove,
      usesRemotePunch,
    ].some((utility) => utility(fighter))
  )
}

export function isAntiAir(fighter: ArcadeFighter): boolean {
  return Boolean(
    fighter.attack?.kind === 'heavy' && (fighter.attack.variant ?? 'standing') === 'standing',
  )
}

export function hurtboxes(fighter: ArcadeFighter): FightBox[] {
  if (fighter.clothCapture) return []
  if (fighter.luiniPassage) return luiniHurtboxes(fighter)
  if (fighter.hanzoProjection) return hurtboxes({ ...sleepingBody(fighter), knockdownFrames: 1 })
  if (fighter.knockdownFrames > 0 || fighter.arsenalSleep || fighter.halkSoulSleep) {
    return [worldBox(fighter, { left: -3.8, right: 3.8, bottom: 0, top: 4.5 })]
  }
  const crouch = fighter.crouching ? 4 : 0
  return [
    worldBox(fighter, { left: -1.7, right: 1.7, bottom: 0, top: 5.2 - crouch }),
    worldBox(fighter, {
      left: -2.1,
      right: 2.1,
      bottom: 4.8 - crouch,
      top: 12 - crouch,
    }),
  ]
}

export function pushbox(fighter: ArcadeFighter): FightBox {
  if (fighter.clothCapture)
    return worldBox(fighter, { left: -0.1, right: 0.1, bottom: 0, top: 0.2 })
  if (fighter.hanzoProjection) return pushbox({ ...sleepingBody(fighter), knockdownFrames: 1 })
  const airborne = fighter.y > 0
  const down = fighter.knockdownFrames > 0 || Boolean(fighter.halkSoulSleep)
  const halfWidth = down ? 3.5 : fighter.crouching ? 2.35 : 2.05
  return worldBox(fighter, {
    left: -halfWidth,
    right: halfWidth,
    bottom: 0,
    top: down ? 2.8 : airborne ? 8.5 : fighter.crouching ? 7.5 : 11,
  })
}

export function boxesOverlap(first: FightBox, second: FightBox): boolean {
  return (
    first.left <= second.right &&
    first.right >= second.left &&
    first.bottom <= second.top &&
    first.top >= second.bottom
  )
}

export function contactPoint(hitbox: FightBox, hurtbox: FightBox): { x: number; y: number } {
  return {
    x: (Math.max(hitbox.left, hurtbox.left) + Math.min(hitbox.right, hurtbox.right)) / 2,
    y: (Math.max(hitbox.bottom, hurtbox.bottom) + Math.min(hitbox.top, hurtbox.top)) / 2,
  }
}

export function otherSide(side: FightSide): FightSide {
  return side === 'player' ? 'opponent' : 'player'
}

export function worldBox(fighter: ArcadeFighter, box: FightBox): FightBox {
  const horizontal =
    fighter.facing === 1
      ? { left: fighter.x + box.left, right: fighter.x + box.right }
      : { left: fighter.x - box.right, right: fighter.x - box.left }
  return {
    ...horizontal,
    bottom: fighter.y + box.bottom,
    top: fighter.y + box.top,
  }
}

function frameMoveId(fighter: ArcadeFighter): string | undefined {
  const source = fighter.attack?.hatsuSource
  const copied = fighter.id === 'chrollo' && source && source !== 'chrollo'
  return copied
    ? (chrolloCopiedMove(fighter, fighter.attack?.moveId) ?? `${source}:neutralSpecial`)
    : fighter.attack?.moveId
}
