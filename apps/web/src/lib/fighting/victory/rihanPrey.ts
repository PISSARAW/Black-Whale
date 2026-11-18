import * as T from 'three'
import type { VictoryContext } from './types'
import type { RihanPose } from './rihanPose'
import type { RihanPlan } from './rihanPlan'
import { RIHAN_TIMING } from './rihanPlan'
import { createVisitHatsuModel } from '../visitHatsuModel'
import { ease, disposeVictoryObject } from './resources'

export function createRihanPrey() {
  const vacuum = createVisitHatsuModel(T, { model: 'blinky', joints: ['open-mouth', 'tongue'] })
  vacuum.root.name = 'rihan-prey-deme-chan'
  const root = new T.Group()
  const geometry = new T.BufferGeometry().setAttribute(
    'position',
    new T.Float32BufferAttribute(new Float32Array(51), 3),
  )
  const strand = new T.Line(geometry, new T.LineBasicMaterial({ color: 0xec91c3 }))
  strand.frustumCulled = false
  root.add(strand)
  return {
    sync(context: VictoryContext, pose: RihanPose, plan: RihanPlan) {
      const { age, victim } = context
      const consumed = ease((age - RIHAN_TIMING.bite) / (RIHAN_TIMING.consumed - RIHAN_TIMING.bite))
      const native = victim.root.getObjectByName('shizuku-blinky')
      if (native) {
        context.save(native)
        native.visible = false
      }
      vacuum.fit({ height: victim.height * 0.7, width: 1.1 })
      vacuum.root.rotation.set(0, -Math.PI / 2, 0)
      vacuum.root.position.set(0, 0, 0)
      vacuum.root.updateWorldMatrix(true, true)
      const handle = vacuum.body.localToWorld(new T.Vector3(-0.3, 0.5, 0))
      vacuum.root.position.add(pose.preyAnchor.clone().sub(handle))
      vacuum.root.updateWorldMatrix(true, true)
      const nozzle =
        plan.kind === 'vacuum'
          ? vacuum.joints.get('open-mouth')!.getWorldPosition(new T.Vector3())
          : pose.preyAnchor
              .clone()
              .lerp(pose.palm, 0.5)
              .add(new T.Vector3(0, 0.06, 0.45))
      const maw = nozzle.clone().add(new T.Vector3(-0.44 * (1 - ease((age - 240) / 42)), 0, 0))
      if (plan.kind === 'vacuum') {
        const gripPoint = vacuum.body.localToWorld(new T.Vector3(-0.3, 0.5, 0))
        vacuum.root.position.lerp(maw, consumed)
        vacuum.root.scale.multiplyScalar(Math.max(0.001, 1 - consumed))
        vacuum.joints.get('tongue')!.rotation.x =
          Math.sin(age * 0.25) * 0.12 * Number(age >= 144 && age < 282)
        vacuum.root.visible = age < RIHAN_TIMING.consumed
        context.add(vacuum.root)
        return {
          maw,
          nozzle,
          consumed,
          gripError: age < 282 ? gripPoint.distanceTo(pose.victimHand) : 0,
        }
      }
      const points = geometry.getAttribute('position')
      for (let i = 0; i < points.count; i++) {
        const t = i / (points.count - 1)
        const point = pose.preyAnchor.clone().lerp(pose.palm, t)
        point.z += Math.sin(t * Math.PI) * 0.45
        point.lerp(maw, consumed)
        points.setXYZ(i, point.x, point.y, point.z)
      }
      points.needsUpdate = true
      strand.visible = plan.kind === 'filament' && age < RIHAN_TIMING.consumed
      context.add(root)
      return { maw, nozzle, consumed, gripError: 0 }
    },
    dispose() {
      vacuum.dispose()
      disposeVictoryObject(root)
    },
  }
}
