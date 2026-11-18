import { Vector3 } from 'three'
import { victoryPortrait, victoryShot, victoryWide } from './camera'
import { visibleVictoryBounds } from './bodyBounds'
import { SAYIRD_COMBAT, SAYIRD_PORTRAIT } from './sayirdTrack'
import type { VictoryContext } from './types'

export function sayirdCamera(context: VictoryContext, insect: Vector3) {
  if (context.comfort.camera === 0) {
    victoryWide(context)
    return
  }
  if (context.age >= SAYIRD_PORTRAIT) {
    victoryPortrait(context)
    return
  }
  if (context.age >= 138 && context.age < 186) {
    const target = new Vector3(context.centre, context.hero.height * 0.65, 0)
    context.camera.position.copy(insect).add(new Vector3(0, 0.04, 0))
    context.camera.up.set(0, 1, 0)
    context.camera.lookAt(target)
    context.camera.updateMatrixWorld(true)
    return
  }
  if (context.age < 90) {
    victoryShot(context, {
      target: insect.clone().add(new Vector3(-0.15, 0.2, 0)),
      offset: new Vector3(0.2, 0.28, 1.8),
      width: 1.25,
      height: 0.8,
    })
    return
  }
  const bounds = visibleVictoryBounds(context.hero.root).union(
    visibleVictoryBounds(context.victim.root),
  )
  const size = bounds.getSize(new Vector3())
  victoryShot(context, {
    target: bounds.getCenter(new Vector3()),
    offset: new Vector3(0.15, context.age >= SAYIRD_COMBAT ? 0.18 : 0.3, 6),
    width: size.x + 0.7,
    height: size.y + 0.5,
  })
}
