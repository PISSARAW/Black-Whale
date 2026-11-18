import { aimCinematicWrist } from './wrist'
import { registerHumanClone } from '$lib/tour/humanClone'
import { keepHumanFigure } from '$lib/tour/humanConstraints'
import { Group, Mesh, Quaternion, Vector3 } from 'three'
import type { Material, Object3D } from 'three'
import type { VictoryContext } from './types'
import { victoryActor, resetVictoryActor } from './actors'
import { guideFutureHand } from './tserriednichArms'
import { createFuturePistol } from './tserriednichExecution'
import { disposeVictoryObject } from './resources'
import { beginVictoryPose, rememberVictoryPose } from './poseContinuity'

/** A solid second body enacts the forecast. It is never a translucent afterimage. */
function temporalCopy(source: Object3D) {
  const root = source.clone(true),
    materials = new Map<Material, Material>()
  root.name = 'tserriednich-perceived-body'
  const originals: Object3D[] = [],
    copies: Object3D[] = []
  source.traverse((node) => originals.push(node))
  root.traverse((node) => copies.push(node))
  const pairs = copies.map((copy, index) => ({ source: originals[index], copy }))
  registerHumanClone(source, new Map(pairs.map(({ source, copy }) => [source, copy])))
  const solid = (source: Material) => {
    const held = materials.get(source)
    if (held) return held
    const made = source.clone()
    made.transparent = false
    made.opacity = 1
    made.depthWrite = true
    materials.set(source, made)
    return made
  }
  root.traverse((node) => {
    if (node instanceof Mesh)
      node.material = Array.isArray(node.material) ? node.material.map(solid) : solid(node.material)
  })
  return { root, materials, pairs }
}
export function createFutureEchoes() {
  const root = new Group(),
    copies = new Map<Object3D, ReturnType<typeof temporalCopy>>()
  const gun = createFuturePistol()
  root.name = 'tserriednich-two-bodies'
  return {
    root,
    sync(options: { context: VictoryContext; origin: Vector3; grippedWrist: Vector3 }) {
      const { context, origin, grippedWrist } = options,
        { age } = context
      const source = context.hero.root
      const entry = copies.get(source) ?? temporalCopy(source)
      copies.set(source, entry)
      entry.pairs.forEach(({ source, copy }) => {
        copy.position.copy(source.position)
        copy.quaternion.copy(source.quaternion)
        copy.scale.copy(source.scale)
        copy.visible = source.visible
      })
      const actor = victoryActor(entry.root, context.state[context.frame.winner].id)
      resetVictoryActor(actor, () => {})
      entry.root.visible = age >= 382 && age < 480
      entry.root.position.copy(origin)
      entry.root.rotation.set(0, 1.15, 0)
      entry.root.updateWorldMatrix(true, true)
      const clock = { token: context.frame.token, age }
      beginVictoryPose(entry.root, clock)
      guideFutureHand(actor, 'right', { target: grippedWrist, amount: 1 })
      guideFutureHand(actor, 'left', { target: grippedWrist, amount: 0 })
      const wrist = entry.root.getObjectByName('hand-right')!
      const facing = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), new Vector3(1, 0, 0))
      aimCinematicWrist(
        wrist,
        facing.multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2)),
      )
      gun.position.set(0, 0, 0)
      gun.rotation.set(Math.PI / 2, 0, 0)
      wrist.add(gun)
      root.add(entry.root)
      keepHumanFigure(entry.root)
      rememberVictoryPose(entry.root, clock)
    },
    dispose() {
      root.removeFromParent()
      disposeVictoryObject(gun)
      copies.forEach((entry) => {
        entry.root.traverse((node) => {
          if ('isInstancedMesh' in node) (node as import('three').InstancedMesh).dispose()
        })
        entry.root.removeFromParent()
        entry.materials.forEach((material) => material.dispose())
      })
      copies.clear()
    },
  }
}
