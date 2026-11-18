import * as T from 'three'
import type { VictoryContext } from './types'
import type { LuiniPose } from './luiniPose'
import { disposeVictoryObject } from './resources'
import { fightStage } from '../stages'

function box(size: [number, number, number], material: T.Material) {
  return new T.Mesh(new T.BoxGeometry(...size), material)
}
export function createLuiniRoom() {
  const root = new T.Group(),
    hinge = new T.Group()
  const wall = new T.MeshBasicMaterial({ color: 0x45434a })
  const steel = new T.MeshBasicMaterial({ color: 0x6e777b })
  const doorMaterial = new T.MeshBasicMaterial({ color: 0x343c45 })
  const sides = [box([1, 1, 1], wall), box([1, 1, 1], wall), box([1, 1, 1], wall)]
  const outline = new T.LineSegments(
    new T.EdgesGeometry(new T.BoxGeometry(1, 1, 1)),
    new T.LineBasicMaterial({ color: 0x9a9290, transparent: true, opacity: 0.3 }),
  )
  const jambs = [
    box([0.12, 1, 0.12], steel),
    box([0.12, 1, 0.12], steel),
    box([0.12, 0.12, 1], steel),
  ]
  const door = box([0.075, 1, 1], doorMaterial)
  const handle = box([0.07, 0.035, 0.18], new T.MeshBasicMaterial({ color: 0xc2a774 }))
  hinge.add(door, handle)
  root.name = 'luini-prepared-single-door-room'
  root.add(...sides, ...jambs, hinge, outline)
  return {
    sync(context: VictoryContext, pose: LuiniPose) {
      const { a, width: w, height: h } = pose.layout
      wall.color
        .set(fightStage(context.state.environment.stageId).swatch[0])
        .lerp(new T.Color(0x6c6261), 0.45)
      root.position.set(a, 0, 0)
      // Three physical surfaces and the one closed door; the viewer-facing wall is a cutaway.
      sides[0].scale.set(0.08, h, w + 0.2)
      sides[0].position.set(-1.8, h / 2, 0)
      sides[1].scale.set(1.8, h, 0.08)
      sides[1].position.set(-0.9, h / 2, -w / 2 - 0.1)
      sides[2].scale.set(1.8, 0.08, w + 0.2)
      sides[2].position.set(-0.9, h, 0)
      outline.scale.set(1.8, h, w + 0.2)
      outline.position.set(-0.9, h / 2, 0)
      jambs.slice(0, 2).forEach((p, i) => {
        p.scale.y = h
        p.position.set(0, h / 2, ((i ? 1 : -1) * w) / 2)
      })
      jambs[2].scale.z = w + 0.12
      jambs[2].position.set(0, h, 0)
      hinge.position.set(0, 0, -w / 2)
      hinge.rotation.y = pose.track.angle
      door.scale.set(1, h, w)
      door.position.set(0, h / 2, w / 2)
      handle.position.set(0.07, pose.layout.handleY, w * 0.75)
      context.add(root)
      return { singleDoor: true, sealed: context.age <= 342, anchorLost: pose.track.anchorLost }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
