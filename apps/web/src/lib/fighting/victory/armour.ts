import { Quaternion, Vector3 } from 'three'
import type { Object3D } from 'three'
import type { VictoryContext } from './types'
import { ease } from './resources'

function followArmour(
  context: VictoryContext,
  options: { joint: string; target?: Object3D; offset?: Vector3 },
) {
  const joint = context.hero.root.getObjectByName(`${options.joint}:combat-joint`),
    target = options.target
  if (!joint?.parent || !target) return
  context.save(joint)
  target.updateWorldMatrix(true, false)
  joint.parent.updateWorldMatrix(true, false)
  const world = (options.offset ?? new Vector3()).applyMatrix4(target.matrixWorld)
  joint.position.copy(joint.parent.worldToLocal(world))
  joint.quaternion.copy(
    joint.parent
      .getWorldQuaternion(new Quaternion())
      .invert()
      .multiply(target.getWorldQuaternion(new Quaternion())),
  )
  joint.scale.copy(
    target.getWorldScale(new Vector3()).divide(joint.parent.getWorldScale(new Vector3())),
  )
  const start = options.joint.endsWith('hood') ? 142 : 90
  joint.scale.multiplyScalar(Math.max(0.001, ease((context.age - start) / 40)))
  joint.visible = context.age >= 90
}
export function victoryArmour(context: VictoryContext) {
  const { root, head } = context.hero
  const armour = root.getObjectByName(`pain-packer:${context.frame.winner}`)
  if (!armour) return
  context.save(armour)
  armour.visible = context.age >= 90
  head.visible = context.age < 170
  for (const name of ['manga-long-coat', 'feitan-coat-folds']) {
    const garment = root.getObjectByName(name)
    if (garment) {
      context.save(garment)
      garment.visible = context.age < 125
    }
  }
  followArmour(context, { joint: 'pain-packer-hood', target: head })
  followArmour(context, {
    joint: 'pain-packer-chest',
    target: root.getObjectByName('torso'),
    offset: new Vector3(0, 0.22, 0),
  })
  const hip = root.getObjectByName('hip-left')
  if (hip)
    followArmour(context, {
      joint: 'pain-packer-coat',
      target: hip.parent ?? undefined,
      offset: new Vector3(0, hip.position.y + 0.07, 0),
    })
  for (const side of ['left', 'right']) {
    followArmour(context, {
      joint: `pain-packer-arm-${side}`,
      target: root.getObjectByName(`shoulder-${side}`),
    })
    followArmour(context, {
      joint: `pain-packer-elbow-${side}`,
      target: root.getObjectByName(`elbow-${side}`),
    })
  }
  root.updateWorldMatrix(true, true)
}
