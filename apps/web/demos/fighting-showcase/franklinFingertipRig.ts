import { Quaternion, Vector3 } from 'three'
import type { Object3D } from 'three'

/** Four fingers and an opposed thumb: flush bores, axial aim and tips hanging under their chains. */
export function positionFranklinFingers(options: {
  hand: Object3D
  side: 'left' | 'right'
  target: Vector3
  opening: number
  save: (node: Object3D) => void
}) {
  const { hand, side, target, opening, save } = options
  const mirror = side === 'right' ? 1 : -1
  const lengths = [0.041, 0.06, 0.067, 0.061, 0.049]
  const muzzles: Vector3[] = [],
    directions: Vector3[] = []
  for (let index = 0; index < 5; index++) {
    const finger = hand.getObjectByName(`franklin-finger-${side}-${index}`)!
    const [shaft, bore, tip, chain, flash] = finger.children
    for (const node of [finger, shaft, bore, tip, chain, flash, ...chain.children]) save(node)
    finger.position.set(
      mirror * (index === 0 ? -0.056 : -0.033 + (index - 1) * 0.022),
      index === 0 ? -0.005 : -0.032,
      index === 0 ? 0.012 : 0,
    )
    const aim = target
      .clone()
      .add(new Vector3(0, (index - 2) * 0.045, side === 'left' ? 0.045 : -0.045))
    const axis = hand.worldToLocal(aim.clone()).sub(finger.position).normalize()
    finger.quaternion.setFromUnitVectors(new Vector3(0, -1, 0), axis)
    const length = lengths[index]
    shaft.position.y = -length / 2
    shaft.scale.y *= length / 0.055
    bore.position.y = -length - 0.001
    finger.updateWorldMatrix(true, true)
    const muzzle = finger.localToWorld(new Vector3(0, -length - 0.002, 0))
    const direction = finger
      .localToWorld(new Vector3(0, -length - 0.012, 0))
      .sub(muzzle)
      .normalize()
    muzzles.push(muzzle)
    directions.push(direction)
    const closed = new Vector3(0.013, -length, 0)
    const capWorld = muzzle
      .clone()
      .add(new Vector3((index === 0 ? -mirror : 0) * 0.015, -0.085, 0.014))
    const capLocal = finger.worldToLocal(capWorld.clone()).sub(tip.children[0].position)
    tip.position.copy(closed.lerp(capLocal, opening))
    tip.quaternion.identity()
    chain.position.set(0, 0, 0)
    chain.quaternion.identity()
    chain.visible = opening > 0.15
    chain.updateWorldMatrix(true, true)
    const start = muzzle.clone().add(new Vector3(0, -0.004, 0.008))
    const end = capWorld.clone().add(new Vector3(0, 0.017, 0))
    chain.children.forEach((link, i) => {
      const point = start.clone().lerp(end, (i + 0.5) / chain.children.length)
      point.z += Math.sin(((i + 0.5) / chain.children.length) * Math.PI) * 0.009
      link.position.copy(chain.worldToLocal(point))
      const world = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), i % 2 ? Math.PI / 2 : 0)
      link.quaternion.copy(chain.getWorldQuaternion(new Quaternion()).invert().multiply(world))
    })
    flash.visible = false
    tip.updateWorldMatrix(true, true)
  }
  return { muzzles, directions }
}
