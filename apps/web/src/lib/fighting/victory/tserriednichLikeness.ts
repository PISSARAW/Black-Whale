import {
  BufferGeometry,
  CatmullRomCurve3,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Raycaster,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three'
import type { Object3D } from 'three'
import type { VictoryContext } from './types'
import { disposeVictoryObject } from './resources'

function princeStubble(head: Object3D) {
  const face = head.getObjectByName('manga-face')!
  const ray = new Raycaster(),
    points: Vector3[] = []
  head.updateWorldMatrix(true, true)
  for (let i = 0; i < 180; i++) {
    const x = (((i * 0.61803398875) % 1) - 0.5) * 0.255
    const y = -0.074 - ((i % 19) / 19) * 0.13
    if (Math.abs(x) < 0.06 && y > -0.13 && y < -0.095) continue
    const origin = head.localToWorld(new Vector3(x, y, 1))
    const direction = head
      .localToWorld(new Vector3(x, y, -1))
      .sub(origin)
      .normalize()
    ray.set(origin, direction)
    const hit = ray.intersectObject(face, true)[0]
    if (!hit) continue
    const p = head.worldToLocal(hit.point.clone()).add(new Vector3(0, 0, 0.0015))
    points.push(p, p.clone().add(new Vector3(x * 0.015, -0.006 - (i % 3) * 0.001, 0)))
  }
  const stubble = new LineSegments(
    new BufferGeometry().setFromPoints(points),
    new LineBasicMaterial({ color: 0x766650, transparent: true, opacity: 0.75 }),
  )
  stubble.name = 'tserriednich-prince-stubble'
  return stubble
}
function uncoveredPrince(head: Object3D) {
  const root = new Group(),
    hair = new MeshBasicMaterial({ color: 0xb3a17b })
  root.name = 'tserriednich-reference-likeness'
  const back = new Mesh(new SphereGeometry(0.18, 22, 16).scale(1.02, 1.3, 0.78), hair)
  back.position.set(0, 0.045, -0.105)
  root.add(back)
  for (const side of [-1, 1])
    for (let i = 0; i < 10; i++) {
      const path = new CatmullRomCurve3([
        new Vector3(side * (0.01 + i * 0.008), 0.215 + Math.sin(i) * 0.008, 0.025 - i * 0.012),
        new Vector3(side * (0.145 + i * 0.003), 0.125, 0.065 - i * 0.014),
        new Vector3(side * (0.17 + i * 0.005), -0.1, 0.025 - i * 0.015),
        new Vector3(
          side * (0.16 + Math.sin(i * 2) * 0.022),
          -0.36 - (i % 4) * 0.018,
          -0.06 - i * 0.008,
        ),
      ])
      root.add(new Mesh(new TubeGeometry(path, 28, 0.009 + (i % 3) * 0.001, 5), hair))
    }
  root.add(princeStubble(head))
  return root
}
function isHoodRim(node: Object3D) {
  return (
    node instanceof Mesh &&
    node.geometry instanceof TubeGeometry &&
    node.geometry.parameters.radius === 0.012
  )
}
export function createTserriednichLikeness() {
  const owned = new Map<Object3D, Group>()
  return {
    apply(context: VictoryContext) {
      const head = context.hero.head
      const look = owned.get(head) ?? uncoveredPrince(head)
      owned.set(head, look)
      const bare = context.age < 66 || context.age >= 210
      for (const node of head.children) {
        const costume =
          node.name.startsWith('tserriednich-hood') ||
          node.name === 'tserriednich-sunglasses' ||
          isHoodRim(node)
        if (!costume && node.name !== 'manga-hair') continue
        context.save(node)
        node.visible = node.name === 'manga-hair' ? false : !bare
      }
      look.visible = bare
      head.add(look)
      context.defer(() => look.removeFromParent())
    },
    dispose() {
      owned.forEach(disposeVictoryObject)
      owned.clear()
    },
  }
}
