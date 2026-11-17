import { CatmullRomCurve3, Mesh, MeshBasicMaterial, Raycaster, TubeGeometry, Vector3 } from 'three'
import type { Object3D } from 'three'

const smiles = new WeakMap<Object3D, ReturnType<typeof buildSmile>>()
const OFFSET = 0.0012
const WIDTH = 0.056

/** Fit a closed-lip curve to the actual skin, rather than placing a flat decal in front. */
function buildSmile(head: Object3D) {
  head.updateWorldMatrix(true, true)
  const face = head.getObjectByName('manga-face')!
  const ray = new Raycaster()
  const skinAt = (x: number, y: number) => {
    const origin = head.localToWorld(new Vector3(x, y, 1))
    const direction = head
      .localToWorld(new Vector3(x, y, -1))
      .sub(origin)
      .normalize()
    ray.set(origin, direction)
    const hit = ray.intersectObject(face, true)[0]
    if (!hit) throw new Error('Smile must stay within Hisoka’s skin surface')
    return head.worldToLocal(hit.point.clone()).add(new Vector3(0, 0, OFFSET))
  }
  const make = (expression: number) => {
    const points = Array.from({ length: 33 }, (_, index) => {
      const t = index / 16 - 1
      return skinAt((t * WIDTH) / 2, -0.108 - (1 - t * t) * (0.0005 + expression * 0.004))
    })
    return new TubeGeometry(new CatmullRomCurve3(points), 48, 0.00085, 6, false)
  }
  const neutral = make(0),
    happy = make(1)
  const geometry = neutral.clone()
  const mesh = new Mesh(geometry, new MeshBasicMaterial({ color: 0x69414b }))
  mesh.name = 'hisoka-natural-closed-smile'
  return {
    mesh,
    neutral: neutral.attributes.position,
    happy: happy.attributes.position,
    audit: { mouthWidth: WIDTH, skinOffset: OFFSET, symmetricSmile: true, closedLips: true },
  }
}

export function naturalHisokaSmile(head: Object3D, expression: number) {
  const smile = smiles.get(head) ?? buildSmile(head)
  smiles.set(head, smile)
  const positions = smile.mesh.geometry.attributes.position
  for (let i = 0; i < positions.count; i++) {
    positions.setXYZ(
      i,
      smile.neutral.getX(i) + (smile.happy.getX(i) - smile.neutral.getX(i)) * expression,
      smile.neutral.getY(i) + (smile.happy.getY(i) - smile.neutral.getY(i)) * expression,
      smile.neutral.getZ(i) + (smile.happy.getZ(i) - smile.neutral.getZ(i)) * expression,
    )
  }
  positions.needsUpdate = true
  smile.mesh.geometry.computeBoundingSphere()
  head.add(smile.mesh)
  return { ...smile.audit, restore: () => head.remove(smile.mesh) }
}
