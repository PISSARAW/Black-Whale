import { canCancel } from './duelMoves'
import { attackData, attackTotal, INPUT_BUFFER_FRAMES } from './frameData'
import { canUseFightHatsu, FIGHT_HATSU_AURA_COST, hatsuSourceFor } from './hatsu'
import { focusAttackRyu, releaseFocusedAura, setIn } from './nen'
import { canUseRangedAttack, RANGED_AURA_COST } from './projectiles'
import { hasMoveResources, moveById } from './movesets'
import type { ArcadeFighter, AttackKind, AttackVariant, FighterId } from './types'

const MIN_X = 7
const MAX_X = 93

export function advanceFighterAttack(fighter: ArcadeFighter): ArcadeFighter {
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
  const usesRyu = fighter.blocking || fighter.ryuWindow > 0
  const focused = usesRyu ? focusAttackRyu(fighter, kind) : fighter
  const prepared = concealed ? setIn(focused, true) : focused
  return {
    ...prepared,
    x: clamp(fighter.x + fighter.facing * data.lunge, MIN_X, MAX_X),
    aura: fighter.aura - attackAuraCost(kind, options.moveId) - (concealed ? 12 : 0),
    pose: kind,
    blocking: false,
    guardFrames: 0,
    ryuWindow: usesRyu ? 10 : fighter.ryuWindow,
    hatsuChargeFrames: 0,
    attack: {
      moveId: options.moveId,
      kind,
      variant: options.variant,
      confirmedHit: false,
      frame: 0,
      impacted: false,
      auraCharged,
      concealed,
      hatsuSource: kind === 'special' ? (options.hatsuSource ?? hatsuSourceFor(fighter)) : null,
      projectileSpawned: false,
    },
    bufferedAttack: null,
  }
}

export function canStartFighterAttack(
  fighter: ArcadeFighter,
  kind: AttackKind,
  moveId?: string,
): boolean {
  const move = moveById(moveId)
  const resourceReady = move
    ? hasMoveResources(fighter, move)
    : kind === 'special'
      ? canUseFightHatsu(fighter)
      : kind !== 'ranged' || canUseRangedAttack(fighter)
  return (
    canAct(fighter) &&
    (fighter.attack === null || cancelReady(fighter, kind, moveId)) &&
    resourceReady
  )
}

export function canBufferFighterAttack(fighter: ArcadeFighter): boolean {
  if (fighter.hitStun > 0 || fighter.blockStun > 0) return true
  if (!fighter.attack) return false
  const remaining = attackTotal(attackData(fighter.attack.kind, fighter)) - fighter.attack.frame
  return remaining <= INPUT_BUFFER_FRAMES
}

function attackAuraCost(kind: AttackKind, moveId?: string): number {
  const move = moveById(moveId)
  if (move) return move.auraCost
  if (kind === 'special') return FIGHT_HATSU_AURA_COST
  return kind === 'ranged' ? RANGED_AURA_COST : 0
}

function canAct(fighter: ArcadeFighter): boolean {
  return fighter.hitStun === 0 && fighter.blockStun === 0 && fighter.health > 0
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function cancelReady(fighter: ArcadeFighter, kind: AttackKind, moveId?: string): boolean {
  if (!canCancel(fighter, kind, moveId) || !fighter.attack) return false
  return fighter.attack.frame <= attackData(fighter.attack.kind, fighter).cancelEnd
}
