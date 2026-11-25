import type { Mesh, Object3D } from 'three'
import type { HumanPose } from './humanAnimation'

const restingPose = (pose: HumanPose) => pose === 'zetsu' || pose === 'fallen'
const movingPose = (pose: HumanPose) => pose === 'walk' || pose === 'attack'

function smooth(value: number) {
  const t = Math.min(1, Math.max(0, value))
  return t * t * (3 - 2 * t)
}

/** A shared facial layer applied after the body and Clash's current expression. */
export function hisokaFaceMotion(head: Object3D) {
  if (head.name !== 'manga-head:hisoka') return
  const eyes = ['left', 'right'].flatMap((side) => {
    const eye = head.getObjectByName(`face-eye-${side}`)
    const gaze = eye?.getObjectByName('hisoka-gaze')
    return eye && gaze ? [{ eye, gaze, previous: eye.scale.y, applied: eye.scale.y }] : []
  })
  // Keep the mesh's influence arrays, including the ink shell's independent weights.
  const sway = head
    .getObjectByName('manga-layered-hair')
    ?.children.map((part) => (part as Mesh).morphTargetInfluences)

  return {
    reset() {
      for (const state of eyes) {
        // A cinematic may have explicitly repositioned the eyelid between frames.
        if (state.eye.scale.y === state.applied) state.eye.scale.y = state.previous
      }
    },
    update(seconds: number, pose: HumanPose) {
      const resting = restingPose(pose)
      const phase = ((seconds % 4.7) + 4.7) % 4.7
      const blink = resting
        ? 0
        : smooth((phase - 1.04) / 0.065) * (1 - smooth((phase - 1.12) / 0.135))
      const glance = smooth((phase - 0.35) / 0.16) * (1 - smooth((phase - 2.5) / 0.2))
      for (const state of eyes) {
        state.previous = state.eye.scale.y
        state.applied = state.previous * (1 - blink * 0.94)
        state.eye.scale.y = state.applied
        state.gaze.position.x = resting ? 0 : glance * 0.007 - head.rotation.y * 0.004
        state.gaze.position.y = resting ? 0 : 0.003 * (glance - 0.3)
      }
      const movement = movingPose(pose) ? 0.72 : 0.24
      for (const weights of sway ?? []) {
        if (weights) weights[0] = resting ? 0 : Math.sin(seconds * 4.3 - 0.4) * movement
      }
    },
  }
}
