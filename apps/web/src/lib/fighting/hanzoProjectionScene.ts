import { sleepingBody } from './hanzoProjection'
import type { ArcadeFighter, FightSide, FightState } from './types'
import type { HumanPose } from '$lib/tour/humanAnimation'

interface ProjectionModel {
  root: import('three').Group
  animate: (seconds: number, pose?: HumanPose) => void
}

export interface ProjectionSceneOptions {
  scene: import('three').Scene
  buildFighter: (fighter: ArcadeFighter) => ProjectionModel
  worldX: (value: number) => number
}

/** The opaque sleeping body stays on the floor; the main rig becomes the double. */
export function createHanzoProjectionScene(options: ProjectionSceneOptions) {
  const bodies = new Map<FightSide, { id: string; model: ProjectionModel }>()
  return {
    sync(state: FightState, seconds: number) {
      for (const side of ['player', 'opponent'] as const) {
        const fighter = state[side]
        let held = bodies.get(side)
        if (!fighter.hanzoProjection) {
          if (held) held.model.root.visible = false
          continue
        }
        if (!held || held.id !== fighter.id) {
          if (held) options.scene.remove(held.model.root)
          held = { id: fighter.id, model: options.buildFighter(sleepingBody(fighter)) }
          bodies.set(side, held)
          options.scene.add(held.model.root)
        }
        held.model.root.visible = true
        held.model.root.position.set(options.worldX(fighter.hanzoProjection.bodyX), 0, 0)
        held.model.root.rotation.y = fighter.hanzoProjection.bodyFacing * 1.25
        held.model.animate(seconds, 'fallen')
      }
    },
    dispose() {
      for (const { model } of bodies.values()) options.scene.remove(model.root)
      bodies.clear()
    },
  }
}

/** Keep the exposed body and both controlled vessels in the camera's span. */
export function projectionCameraSpan(
  state: FightState,
  positions: number[],
  worldX: (x: number) => number,
) {
  for (const fighter of [state.player, state.opponent]) {
    if (fighter.hanzoProjection) positions.push(worldX(fighter.hanzoProjection.bodyX))
    if (fighter.luiniPassage) positions.push(worldX(fighter.luiniPassage.originX))
  }
  for (const guest of state.rosterGuests ?? [])
    if (guest.phase !== 'eliminated') positions.push(worldX(guest.fighter.x))
  const left = Math.min(...positions)
  const right = Math.max(...positions)
  return { centre: (left + right) / 2, gap: right - left }
}
