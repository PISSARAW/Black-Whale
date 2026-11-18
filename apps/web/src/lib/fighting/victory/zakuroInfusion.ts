import * as T from 'three'
import type { VictoryContext } from './types'
import type { ZakuroPose } from './zakuroPose'
import { localToHead } from './pose'
import { disposeVictoryObject } from './resources'

export function createZakuroInfusion() {
  const root = new T.Group(),
    bag = new T.Group()
  const shell = new T.Mesh(
    new T.BoxGeometry(0.15, 0.24, 0.045),
    new T.MeshBasicMaterial({
      color: 0xc9c4bf,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    }),
  )
  const blood = new T.Mesh(
    new T.BoxGeometry(0.115, 0.16, 0.025),
    new T.MeshBasicMaterial({ color: 0x981537 }),
  )
  blood.position.y = -0.025
  const label = new T.Mesh(
    new T.PlaneGeometry(0.09, 0.05),
    new T.MeshBasicMaterial({ color: 0xe8e1d7 }),
  )
  label.position.set(0, 0.055, 0.026)
  bag.add(shell, blood, label)
  const tube = new T.Mesh(new T.BufferGeometry(), new T.MeshBasicMaterial({ color: 0x914554 }))
  root.name = 'zakuro-carried-infusion-kit'
  root.add(bag, tube)
  return {
    sync(context: VictoryContext, pose: ZakuroPose) {
      bag.position.copy(localToHead(context.hero, new T.Vector3(0.28, -0.43, 0.12)))
      bag.quaternion.copy(context.hero.head.getWorldQuaternion(new T.Quaternion()))
      const from = bag.position.clone().add(new T.Vector3(0, -0.12, 0))
      const mid = from
        .clone()
        .lerp(pose.wound, 0.5)
        .add(new T.Vector3(0, -0.12, 0.05))
      tube.geometry.dispose()
      tube.geometry = new T.TubeGeometry(
        new T.CatmullRomCurve3([from, mid, pose.wound]),
        18,
        0.005,
        6,
        false,
      )
      context.add(root)
      return { infusionEquipment: true, cinematicHealing: false }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
