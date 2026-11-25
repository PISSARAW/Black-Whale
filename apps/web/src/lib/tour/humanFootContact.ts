import type { Object3D, Vector3 } from 'three'

/** Read the centre of a sole while using its heel and toe as the vertical contact envelope. */
export function humanFootContactPoint(foot: Object3D, space: Object3D, probe: Vector3): Vector3 {
  const ground = foot.getObjectByName(contactName(foot, 'ground-contact')) ?? foot
  const point = localPosition(ground, space, probe).clone()
  const heel = foot.getObjectByName(contactName(foot, 'heel'))
  const toe = foot.getObjectByName(contactName(foot, 'toe'))
  point.y = Math.min(
    heel ? localPosition(heel, space, probe).y : point.y,
    toe ? localPosition(toe, space, probe).y : point.y,
  )
  return point
}

/** Both sole endpoints must clear a surface, even when the ankle pitches. */
export function humanFootClearance(foot: Object3D, space: Object3D, probe: Vector3): number {
  const point = humanFootContactPoint(foot, space, probe)
  return point.y
}

function contactName(foot: Object3D, prefix: string): string {
  const side = foot.name.endsWith('-left') ? 'left' : 'right'
  return `${prefix}-${side}`
}

function localPosition(anchor: Object3D, space: Object3D, probe: Vector3): Vector3 {
  return space.worldToLocal(anchor.getWorldPosition(probe))
}
