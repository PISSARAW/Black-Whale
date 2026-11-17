import { CatmullRomCurve3, Mesh, MeshBasicMaterial, Raycaster, TubeGeometry, Vector3 } from 'three'
import type { Object3D } from 'three'
import type { VictoryContext } from './types'
import { ease } from './resources'

/** A small closed smile fitted to the skin, preserving the native face and head. */
function buildSmile(head: Object3D) {
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
    if (!hit) throw new Error('Hisoka smile extends beyond the skin')
    return head.worldToLocal(hit.point.clone()).add(new Vector3(0, 0, 0.0012))
  }
  const make = (expression: number) =>
    new TubeGeometry(
      new CatmullRomCurve3(
        Array.from({ length: 33 }, (_, index) => {
          const t = index / 16 - 1
          return skinAt(t * 0.028, -0.108 - (1 - t * t) * (0.0005 + expression * 0.004))
        }),
      ),
      48,
      0.00085,
      6,
    )
  const neutral = make(0),
    happy = make(1)
  const mesh = new Mesh(neutral.clone(), new MeshBasicMaterial({ color: 0x69414b }))
  mesh.name = 'hisoka-natural-closed-smile'
  const from = neutral.attributes.position.clone(),
    to = happy.attributes.position.clone()
  neutral.dispose()
  happy.dispose()
  return { mesh, from, to }
}
export function createVictorySmile() {
  const cache = new Map<Object3D, ReturnType<typeof buildSmile>>()
  return {
    apply(context: VictoryContext) {
      const head = context.hero.head
      const smile = cache.get(head) ?? buildSmile(head)
      cache.set(head, smile)
      const expression = ease((context.age - 400) / 110)
      const positions = smile.mesh.geometry.attributes.position
      for (let i = 0; i < positions.count; i++) {
        positions.setXYZ(
          i,
          smile.from.getX(i) + (smile.to.getX(i) - smile.from.getX(i)) * expression,
          smile.from.getY(i) + (smile.to.getY(i) - smile.from.getY(i)) * expression,
          smile.from.getZ(i) + (smile.to.getZ(i) - smile.from.getZ(i)) * expression,
        )
      }
      positions.needsUpdate = true
      smile.mesh.geometry.computeBoundingSphere()
      for (const name of ['face-mouth', 'clash-face-contours']) {
        const part = head.getObjectByName(name)
        if (part) {
          context.save(part)
          part.visible = false
        }
      }
      head.add(smile.mesh)
      context.defer(() => smile.mesh.removeFromParent())
    },
    dispose() {
      cache.forEach(({ mesh }) => {
        mesh.geometry.dispose()
        mesh.material.dispose()
      })
      cache.clear()
    },
  }
}
