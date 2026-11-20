import { recordMotion } from '../motionRecord'
import { halkenburgBodyControl } from '../halkenburgHostMotion'
import { halkenburgOwnBody } from '../halkenburgSoulTypes'
import { updatePlayerGuard } from '../nenCombat/guardInput'
import { illumiInput } from '../illumiFrame'
import { poseFighter } from '../fightActorPose'
import { holdMary, maryHeld } from '../bloodyMary'
import { maryAiBody, maryAiBusy } from '../bloodyMaryAi'
import { battleInput, battlePreparing } from '../battleCantabileRules'
import { canAct, canMove, playerCanJump } from '../fightActorState'
import { blinkyAiDefense } from '../blinkyWounds'
import { plugWoundsInput } from '../blinky'
import { steerCyclotron } from '../phinksCyclotron'
import { melodyInput } from '../melodyChannel'
import { futurePerceivedTarget } from '../parallelFuture'
import { closeFutureEyes } from '../parallelFutureAbility'
import { steerFutureAi } from '../parallelFutureAi'
import { canRejoinHanzoBody, steerHanzoProjection, wakeHanzoBody } from '../hanzoProjection'
import { applyAuraContext, IN_CHARGE_FRAMES, setIn } from '../nen'
import { moveCounterplayOpponent } from '../counterplayOpponent'
import { advanceFighterPhysics } from '../fighterPhysics'
import { steerFighter } from '../fighterMovement'
import { dashCancel } from '../dashCancel'
import type { ArcadeFighter, FightInput, FightState } from '../types'
import type { DuelBodies, DuelInputs } from './types'

/** Per-body phase: inputs, AI, physics and body clocks. Runs exactly once per body and frame. */
export function stepActors(state: FightState, inputs: DuelInputs): DuelBodies {
  const player = updateControlledFighter(state.player, inputs.player)
  const opponent = inputs.opponent
    ? updateControlledFighter(state.opponent, inputs.opponent)
    : updateOpponent(state.opponent, futurePerceivedTarget(state, 'opponent', player), state)
  return { player, opponent }
}

export function updateControlledFighter(fighter: ArcadeFighter, input: FightInput): ArcadeFighter {
  if (!halkenburgOwnBody(fighter)) return halkenburgBodyControl(advanceFighterPhysics(fighter))!
  if (fighter.easterEgg) return poseFighter(advanceFighterPhysics(fighter))
  fighter = illumiInput(fighter, input)
  const advanced = advanceFighterPhysics(
    plugWoundsInput(battleInput(melodyInput(fighter, input), input), input),
  )
  if (advanced.needlePuppet) return advanced
  if (maryHeld(advanced)) return holdMary(applyAuraContext(advanced, input))
  if (advanced.parallelEyesClosed) return closeFutureEyes(advanced)
  const winding = steerCyclotron(advanced, input)
  if (winding) return winding
  if (advanced.hanzoProjection) return poseFighter(steerHanzoProjection(advanced, input))
  let next = updateHatsuCharge(applyAuraContext(advanced, input), input)
  next = updatePlayerGuard({ ...next, crouching: input.down && next.y === 0 }, input)
  next = dashCancel(next, input) ?? next
  const steered = steerFighter(next, {
    input,
    mobile: canMove(next),
    jumpable: playerCanJump(next, input),
  })
  return recordMotion(poseFighter(steered), input)
}

function updateHatsuCharge(fighter: ArcadeFighter, input: FightInput): ArcadeFighter {
  let next = fighter
  const chargingHatsu = input.hatsu && canAct(next) && next.attack === null
  const hatsuChargeFrames = chargingHatsu ? next.hatsuChargeFrames + 1 : next.hatsuChargeFrames
  if (activatesIn(next, chargingHatsu, hatsuChargeFrames)) next = setIn(next, true)
  if (!input.conceal && releasesIn(next, chargingHatsu)) next = setIn(next, false)
  return { ...next, hatsuChargeFrames }
}

function activatesIn(fighter: ArcadeFighter, charging: boolean, frames: number): boolean {
  return charging && frames >= IN_CHARGE_FRAMES
}

function releasesIn(fighter: ArcadeFighter, charging: boolean): boolean {
  return !charging && !fighter.attack?.concealed && fighter.nen.in
}

export function updateOpponent(
  fighter: ArcadeFighter,
  player: ArcadeFighter,
  state: FightState,
): ArcadeFighter {
  const advanced = blinkyAiDefense(state, advanceFighterPhysics(fighter))
  const soul = halkenburgBodyControl(advanced)
  if (soul) return soul
  if (advanced.easterEgg) return poseFighter(advanced)
  if (advanced.needlePuppet) return advanced
  if (maryAiBusy(advanced)) return maryAiBody(advanced)
  if (battlePreparing(advanced)) return { ...advanced, pose: 'special', blocking: false }
  const winding = steerCyclotron(advanced)
  if (winding) return winding
  if (advanced.parallelEyesClosed) return closeFutureEyes(advanced)
  if (shouldRejoinHanzoBody(advanced)) return wakeHanzoBody(advanced)
  return poseFighter(
    steerFutureAi(state, advanced) ??
      moveCounterplayOpponent({ state, fighter: advanced, target: player }),
  )
}

function shouldRejoinHanzoBody(fighter: ArcadeFighter): boolean {
  return Boolean(fighter.hanzoProjection) && canRejoinHanzoBody(fighter) && fighter.aura < 16
}
