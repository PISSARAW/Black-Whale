import {
  attackWeightTransfer,
  carryRecoveryWeight,
  type AttackWeightTransfer,
} from './fightWeightTransfer'
import { rosterStrikeShape } from './rosterKeyPoses'
import type { AttackFrameData } from './frameData'
import type { ArcadeFighter, MoveSlot } from './types'

export function attackTransfer(fighter: ArcadeFighter, slot: MoveSlot) {
  const attack = fighter.attack!
  if (attack.variant === 'air' || attack.variant === 'throw' || fighter.y > 0) return undefined
  return attackWeightTransfer({
    id: fighter.id,
    kind: attack.kind,
    slot,
    shape: rosterStrikeShape(fighter.id, slot),
  })
}

export function recoveryTransfer(
  fighter: ArcadeFighter,
  timing: { transfer?: AttackWeightTransfer; frame: number; frames: AttackFrameData },
) {
  const { transfer, frame, frames } = timing
  if (!transfer || !fighter.attack!.confirmedHit || frame <= frames.startup + frames.active)
    return undefined
  return carryRecoveryWeight({
    transfer,
    recovery: (frame - frames.startup - frames.active) / Math.max(1, frames.recovery),
  })
}
