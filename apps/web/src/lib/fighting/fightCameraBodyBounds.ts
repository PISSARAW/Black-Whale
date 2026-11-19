import { humanAnimationRig } from '$lib/tour/humanAnimation'
import type { HumanFigure } from '$lib/tour/humanFigure'
import type { FightSide, FightState } from './types'

export type FallenBodyBounds = Partial<Record<FightSide, { left: number; right: number }>>

/** The fall widens as the animated limbs extend into the shot. */
export function fightCameraBodyBounds(
  state: FightState,
  models: Record<FightSide, { model: Pick<HumanFigure, 'turns'> }>,
): FallenBodyBounds {
  const bounds: FallenBodyBounds = {}
  for (const side of ['player', 'opponent'] as const) {
    if (!['down', 'ko', 'wakeup'].includes(state[side].pose)) continue
    const body = humanAnimationRig(models[side].model.turns)
    if (!body) continue
    body.figure.updateWorldMatrix(true, true)
    const landmarks = [
      body.figure,
      body.head,
      ...body.knees.map((knee) => knee.children[1] ?? knee),
      ...body.arms.map(
        (arm) => arm.children[1]?.children.find((part) => part.name.startsWith('hand-')) ?? arm,
      ),
    ]
    const x = landmarks.map((part) => part.matrixWorld.elements[12])
    bounds[side] = { left: Math.min(...x) - 0.34, right: Math.max(...x) + 0.34 }
  }
  return bounds
}
