import { bonolenovHasSpear } from './bonolenovArmedProfile'
import { bonolenovDashTurn, crossedDanceStep } from './bonolenovDanceFootwork'
import { addPoses, scalePose, type BodyPlan, type FightPose } from './fightPose'
import { motionOf } from './fighterMovement'
import { dashPose } from './fightLocomotion'
import { WAVE_FOUR_RHYTHM_MOVEMENT } from './physicalLocomotionWaveFourRhythm'
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
  const { phase, wave, turn } = stepCycle(fighter, advancing)
  const armed = bonolenovHasSpear(fighter)
  const standing = armed ? PROLOGUE_CARRY_POSE : fightStance('bonolenov')!.pose
  const pose = armed
    ? addPoses(
        standing,
        carryStep({ advancing, wave, turn, dashing: Boolean(dash) }),
        spearTravel({ advancing, wave, dashing: Boolean(dash) }),
      )
    : unarmedStep(fighter, standing, { advancing, wave, turn, phase })
  return {
    key: dash ? `bonolenov:pivot:${advancing}` : `bonolenov:step:${advancing}`,
    plant: true,
    blend: dash ? 0.025 : 0.06,
    pose,
  }
}

function canDanceStep(fighter: ArcadeFighter): boolean {
  if (fighter.pose !== 'walk' || fighter.crouching || fighter.y > 0) return false
  const motion = motionOf(fighter)
  return !motion.prejumpFrames && !motion.landingFrames && !fighter.blocking
}

function stepCycle(fighter: ArcadeFighter, advancing: boolean) {
  const dash = motionOf(fighter).dash
  const progress = dash ? Math.min(1, dash.frame / Math.max(1, dash.frames - 1)) : 0
  const phase = dash ? progress * Math.PI * 2 : shufflePhase(fighter)
  const wave = Math.sin(phase + Math.sin(phase * 2) * 0.32)
  const turn =
    dash && !bonolenovHasSpear(fighter)
      ? bonolenovDashTurn(progress, advancing)
      : wave * (dash ? 0.24 : 0.17)
  return { phase, wave, turn }
}

interface StepBeat {
  advancing: boolean
  wave: number
  turn: number
}

function unarmedStep(
  fighter: ArcadeFighter,
  standing: FightPose,
  beat: StepBeat & { phase: number },
): FightPose {
  const rush = dashPose(fighter, standing)
  if (rush) return addPoses(rush.pose, { body: [0.025, beat.turn, 0] })
  const { walk } = WAVE_FOUR_RHYTHM_MOVEMENT.bonolenov
  return addPoses(
    standing,
    crossedDanceStep(beat.phase, beat.advancing),
    beat.advancing ? walk.advance : walk.retreat,
    scalePose(walk.rhythm, beat.wave),
  )
}

function carryStep({ advancing, wave, turn, dashing }: StepBeat & { dashing: boolean }): FightPose {
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
  }
}

function spearTravel({
  advancing,
  wave,
  dashing,
}: Omit<StepBeat, 'turn'> & { dashing: boolean }): FightPose {
  const pulse = wave * (dashing ? 0.7 : 0.43)
  return advancing
    ? {
        leadShoulder: [-0.29 - 0.35 * pulse, 0.2 * pulse, 0.17],
        leadElbow: [0.48 + 0.5 * pulse, 0, 0],
        leadWrist: [-0.22 * pulse, 0.27 * pulse, 0.18],
        rearShoulder: [-0.37 + 0.24 * pulse, -0.35, -0.42],
      }
    : {
        leadShoulder: [-0.21, -0.38 - 0.35 * pulse, 0.29],
        leadElbow: [-0.32 + 0.31 * pulse, 0, 0],
        leadWrist: [0.14 + 0.25 * pulse, -0.17, -0.33],
        rearShoulder: [-0.38, -0.24, -0.49 - 0.17 * pulse],
      }
}
