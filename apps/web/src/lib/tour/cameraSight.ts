import {
  Mesh,
  Raycaster,
  Vector2,
  Vector3,
  type Intersection,
  type Object3D,
  type PerspectiveCamera,
} from 'three'

/** Tests against the same 3D cover the camera renders. */
export class CameraSight {
  private readonly ray = new Raycaster()
  private readonly clip = new Vector3()
  private readonly aim = new Vector2()

  constructor(private readonly camera: PerspectiveCamera) {}

  sees(point: Vector3, target: Object3D, cover: Object3D[]): boolean {
    const clip = this.clip.copy(point).project(this.camera)
    if (Math.abs(clip.x) > 1 || Math.abs(clip.y) > 1 || Math.abs(clip.z) > 1) return false
    return this.hitsTarget(this.aim.set(clip.x, clip.y), target, cover)
  }

  aimsAt(target: Object3D, cover: Object3D[]): boolean {
    return this.hitsTarget(this.aim.set(0, 0), target, cover)
  }

  private hitsTarget(aim: Vector2, target: Object3D, cover: Object3D[]): boolean {
    this.ray.setFromCamera(aim, this.camera)
    const hit = this.ray.intersectObject(target, true).find(renderedSurface)
    if (!hit) return false
    return !this.ray
      .intersectObjects(cover, true)
      .some((obstacle) => obstacle.distance <= hit.distance && renderedSurface(obstacle))
  }
}

function renderedSurface({ object, face }: Intersection): boolean {
  if (!(object instanceof Mesh)) return false
  const material = Array.isArray(object.material)
    ? object.material[face?.materialIndex ?? 0]
    : object.material
  if (!material?.visible || !material.depthWrite || !material.colorWrite) return false
  return visibleInHierarchy(object)
}

function visibleInHierarchy(object: Object3D): boolean {
  for (let node: Object3D | null = object; node; node = node.parent) {
    if (!node.visible) return false
  }
  return true
}
