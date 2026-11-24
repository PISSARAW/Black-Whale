import { addPoses, type BodyPlan, type FightPose } from './fightPose'
import { motionOf } from './fighterMovement'
import { combatLocomotion, combatWalk } from './firstFiveCombatMotion'
import { shufflePhase } from './fightShuffleStep'
import { fightStance } from './fightStance'
import { PROLOGUE_CARRY_POSE } from './keyPosesBonolenov'
import type { ArcadeFighter } from './types'

/** Dance-like step changes follow actual travelled distance and the finite dash counter. */
export function bonolenovStepPlan(fighter: ArcadeFighter): BodyPlan | null {
  if (!canDanceStep(fighter)) return null
  const motion = motionOf(fighter)
  const dash = motion.dash
  const advancing = (dash?.direction ?? motion.heldDirection) === fighter.facing
  const { phase, wave, turn } = stepCycle(fighter)
  const armed = Boolean(fighter.battleCantabile?.prologue)
  const standing = armed ? PROLOGUE_CARRY_POSE : fightStance('bonolenov')!.pose
  const style = combatLocomotion(fighter)
  const accent = style && !dash && !armed ? combatWalk(style, phase, advancing) : {}
  return {
    key: dash ? `bonolenov:pivot:${advancing}` : `bonolenov:step:${advancing}`,
    plant: true,
    blend: dash ? 0.025 : 0.06,
    pose: addPoses(
      standing,
      stepPose({ advancing, wave, turn, armed, dashing: Boolean(dash) }),
      accent,
    ),
  }
}

function canDanceStep(fighter: ArcadeFighter): boolean {
  if (fighter.pose !== 'walk' || fighter.crouching || fighter.y > 0) return false
  const motion = motionOf(fighter)
  return !motion.prejumpFrames && !motion.landingFrames && !fighter.blocking
}

function stepCycle(fighter: ArcadeFighter) {
  const dash = motionOf(fighter).dash
  const progress = dash ? Math.min(1, dash.frame / Math.max(1, dash.frames - 1)) : 0
  const phase = dash ? progress * Math.PI * 2 : shufflePhase(fighter)
  const wave = Math.sin(phase)
  const turn =
    dash && !fighter.battleCantabile?.prologue
      ? Math.PI * 2 * Math.sin(progress * Math.PI) ** 2
      : wave * (dash ? 0.24 : 0.17)
  return { phase, wave, turn }
}

function stepPose({
  advancing,
  wave,
  turn,
  armed,
  dashing,
}: {
  advancing: boolean
  wave: number
  turn: number
  armed: boolean
  dashing: boolean
}): FightPose {
  const stride = dashing ? 1 : 0.77
  const lead = Math.max(0, wave) * stride
  const rear = Math.max(0, -wave) * stride
  return {
    body: [advancing ? 0.04 : -0.025, turn, wave * 0.035],
    chest: [0, wave * 0.14, 0],
    leadHip: [-lead * 0.45, 0, lead * 0.1],
    leadKnee: [lead * 0.8, 0, 0],
    rearHip: [-rear * 0.45, 0, -rear * 0.1],
    rearKnee: [rear * 0.8, 0, 0],
    ...(!armed
      ? {
          leadShoulder: [-0.12, 0, 0.45],
          rearShoulder: [-0.18, 0, -0.6],
          leadElbow: [0.65, 0, 0],
          rearElbow: [-0.15, 0, 0],
        }
      : {}),
  }
}
