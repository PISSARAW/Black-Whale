import { WAKEUP_INVULNERABLE_FRAMES, REVERSAL_WINDOW_FRAMES } from './throwRules'
import { holdMary, maryHeld } from './bloodyMary'
import { anchorFighter, fighterAnchored } from './fighterAnchors'
import { crossGameRestrained, holdCrossGame } from './crossGame'
import { sleepingBody } from './hanzoProjection'
import { advanceCyclotron } from './phinksCyclotron'
import { advanceFighterAttack } from './fighterAttacks'
import { advanceAirborne } from './fighterMovement'
import { applyAirRecovery } from './airRecovery'
import { boxesOverlap, FIXED_STEP, pushbox } from './frameData'
import { advanceNen } from './nen'
import { coolAccelHeat } from './accelCancel'
import { crossesBody } from './signatureCrossing'
import { EMPTY_INPUT, type ArcadeFighter, type FightInput, type FightState } from './types'

const GROUND = 0
const MIN_X = 7
const MAX_X = 93

export function advanceFighterPhysics(
  fighter: ArcadeFighter,
  input: FightInput = EMPTY_INPUT,
): ArcadeFighter {
  fighter = advanceCyclotron(fighter)
  fighter = holdMary(holdCrossGame(fighter))
  fighter = applyAirRecovery(fighter, input)
  const vertical =
    crossGameRestrained(fighter) || maryHeld(fighter) ? fighter : advanceAirborne(fighter)
  const wakeup = advanceWakeup(fighter)
  const combo = advanceCombo(fighter, vertical.y, wakeup)
  const advanced = advanceFighterAttack({
    ...fighter,
    arenaRecovery: Math.max(0, (fighter.arenaRecovery ?? 0) - 1),
    preparationRecovery: Math.max(0, (fighter.preparationRecovery ?? 0) - 1),
    ...vertical,
    airRecovery: vertical.y > GROUND ? fighter.airRecovery : undefined,
    ...wakeup,
    ...combo,
    throwTechRecoveryFrames: Math.max(0, (fighter.throwTechRecoveryFrames ?? 0) - 1),
    hitStun: Math.max(0, fighter.hitStun - 1),
    blockStun: Math.max(0, fighter.blockStun - 1),
    ryuWindow: Math.max(0, fighter.ryuWindow - 1),
    throwTechFrames: Math.max(0, (fighter.throwTechFrames ?? 0) - 1),
    ...(fighter.accelHeat ? { accelHeat: coolAccelHeat(fighter.accelHeat) } : {}),
  })
  return holdMary(holdCrossGame(advanceNen(advanced, FIXED_STEP)))
}

function advanceWakeup(
  fighter: ArcadeFighter,
): Pick<ArcadeFighter, 'knockdownFrames' | 'wakeupInvulnerableFrames' | 'reversalWindow'> {
  const knockdownFrames = Math.max(0, fighter.knockdownFrames - 1)
  const wokeUp = fighter.knockdownFrames > 0 && knockdownFrames === 0
  if (wokeUp)
    return {
      knockdownFrames,
      wakeupInvulnerableFrames: WAKEUP_INVULNERABLE_FRAMES,
      reversalWindow: REVERSAL_WINDOW_FRAMES,
    }
  return {
    knockdownFrames,
    wakeupInvulnerableFrames: Math.max(0, fighter.wakeupInvulnerableFrames - 1),
    reversalWindow: Math.max(0, fighter.reversalWindow - 1),
  }
}

function advanceCombo(
  fighter: ArcadeFighter,
  y: number,
  wakeup: Pick<ArcadeFighter, 'knockdownFrames'>,
): Pick<ArcadeFighter, 'comboHits' | 'comboDamage' | 'juggleCount'> {
  const standing = y === GROUND && wakeup.knockdownFrames === 0
  // A body held by Machi's bind cannot defend: the combo it is in goes on (machiThread.ts).
  const bound = fighter.machiThread?.kind === 'bind'
  const resetCombo = standing && fighter.hitStun <= 1 && fighter.knockdownFrames === 0 && !bound
  return {
    comboHits: resetCombo ? 0 : fighter.comboHits,
    comboDamage: resetCombo ? 0 : fighter.comboDamage,
    juggleCount: standing ? 0 : fighter.juggleCount,
  }
}

export function separateFighterPushboxes(
  player: ArcadeFighter,
  opponent: ArcadeFighter,
): Pick<FightState, 'player' | 'opponent'> {
  player = holdMary(holdCrossGame(player))
  opponent = holdMary(holdCrossGame(opponent))
  player = anchorFighter(player)
  opponent = anchorFighter(opponent)
  if (player.hanzoProjection || opponent.hanzoProjection) {
    return {
      player: {
        ...player,
        facing: player.x <= sleepingBody(opponent).x ? 1 : -1,
      },
      opponent: {
        ...opponent,
        facing: opponent.x <= sleepingBody(player).x ? 1 : -1,
      },
    }
  }
  const playerFacing: -1 | 1 = player.x <= opponent.x ? 1 : -1
  const playerBox = pushbox(player)
  const opponentBox = pushbox(opponent)
  const opponentFacing = oppositeFacing(playerFacing)
  if (!canPush(player, opponent, boxesOverlap(playerBox, opponentBox))) {
    return {
      player: { ...player, facing: playerFacing },
      opponent: { ...opponent, facing: opponentFacing },
    }
  }
  const overlap = pushboxOverlap(playerFacing, playerBox, opponentBox)
  const [playerShift, opponentShift] = pushShifts(player, opponent, overlap)
  return {
    player: {
      ...player,
      x: clamp(player.x - playerShift * playerFacing, MIN_X, MAX_X),
      facing: playerFacing,
    },
    opponent: {
      ...opponent,
      x: clamp(opponent.x + opponentShift * playerFacing, MIN_X, MAX_X),
      facing: opponentFacing,
    },
  }
}

function oppositeFacing(facing: -1 | 1): -1 | 1 {
  return facing === 1 ? -1 : 1
}

function canPush(player: ArcadeFighter, opponent: ArcadeFighter, overlaps: boolean): boolean {
  if (maryHeld(player) || maryHeld(opponent)) return false
  if (player.clothCapture || opponent.clothCapture) return false
  if (crossesBody(player) || crossesBody(opponent)) return false
  return overlaps && player.y <= 7 && opponent.y <= 7
}

function pushboxOverlap(
  facing: -1 | 1,
  player: ReturnType<typeof pushbox>,
  opponent: ReturnType<typeof pushbox>,
): number {
  return facing === 1 ? player.right - opponent.left : opponent.right - player.left
}

function positionFixed(fighter: ArcadeFighter): boolean {
  return fighterAnchored(fighter) || crossGameRestrained(fighter)
}

function pushShifts(
  player: ArcadeFighter,
  opponent: ArcadeFighter,
  overlap: number,
): [number, number] {
  const playerFixed = positionFixed(player)
  const opponentFixed = positionFixed(opponent)
  if (playerFixed && opponentFixed) return [0, 0]
  if (playerFixed) return [0, overlap]
  if (opponentFixed) return [overlap, 0]
  const playerAtWall = player.x <= MIN_X || player.x >= MAX_X
  const opponentAtWall = opponent.x <= MIN_X || opponent.x >= MAX_X
  if (playerAtWall) return [0, overlap]
  if (opponentAtWall) return [overlap, 0]
  return [overlap / 2, overlap / 2]
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}
