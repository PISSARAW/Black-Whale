import { Box3, Vector3, type Object3D } from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { throwPerformance } from './catalogue'
import type { ThrowCinematicFrame } from '../throwCinematic'
import type { IntroLandmarkBounds } from '../presentation/introLandmarks'

export function throwDetailAnchors(
  actor: Object3D | undefined,
  victim: Object3D | undefined,
  frame: ThrowCinematicFrame,
) {
  if (!actor || !victim) return undefined
  const performance = throwPerformance(frame.performance)
  const from = detailSource(actor, frame)
  const human = humanAnimationRig(victim)
  if (!from || !human) return undefined
  const targets = {
    wrist: human.arms[0].children[1],
    knee: human.knees[0],
    torso: human.torso,
  }
  const target = performance?.detail?.victim ?? 'wrist'
  const node =
    frame.performance === 'kurapika-last-link' ? human.knees[0].children[1] : targets[target]
  return {
    from: from.getWorldPosition(new Vector3()),
    to: node.getWorldPosition(new Vector3()),
    yaw: detailYaw(frame),
  }
}

function detailSource(figure: Object3D, frame: ThrowCinematicFrame): Object3D | undefined {
  const performance = throwPerformance(frame.performance)
  if (!performance) return figure.getObjectByName('hand-right')
  const anchor = performance.detail?.anchor
  if (anchor === 'head' || performance.effect === 'collector')
    return humanAnimationRig(figure)?.head
  if (anchor === 'prop') return propAnchor(figure, performance.effect)
  const names: Record<string, string> = { book: 'chrollo-open-book', chain: 'hand-right' }
  const name = names[performance.effect] ?? (frame.facing === 1 ? 'hand-right' : 'hand-left')
  return figure.getObjectByName(name) ?? figure.getObjectByName('hand-right')
}

function propAnchor(figure: Object3D, effect: string) {
  let scene = figure
  while (scene.parent) scene = scene.parent
  return scene.getObjectByName(`throw-signature:${effect}`) ?? figure.getObjectByName('hand-right')
}

export function throwEquipmentBounds(
  bounds: IntroLandmarkBounds,
  actor: Object3D | undefined,
  frame: ThrowCinematicFrame,
): IntroLandmarkBounds {
  if (!actor || throwPerformance(frame.performance)?.effect !== 'staff') return bounds
  const staff = propAnchor(actor, 'staff')
  if (!staff?.visible) return bounds
  const box = new Box3().setFromObject(staff)
  if (box.isEmpty()) return bounds
  return {
    left: Math.min(bounds.left, box.min.x),
    right: Math.max(bounds.right, box.max.x),
    bottom: Math.min(bounds.bottom, Math.max(0.02, box.min.y)),
    top: Math.max(bounds.top, box.max.y),
    near: Math.min(bounds.near, box.min.z),
    far: Math.max(bounds.far, box.max.z),
  }
}

function detailYaw(frame: ThrowCinematicFrame) {
  const performance = throwPerformance(frame.performance)
  if (performance?.detail) return performance.detail.yaw
  const effect = performance?.effect ?? 'gum'
  const yaws: Record<string, number> = {
    book: -0.85,
    collector: 0,
    military: -0.55,
    chain: 0.45,
    gum: -0.25,
  }
  return yaws[effect] ?? 0.25
}
