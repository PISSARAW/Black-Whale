import { Euler, Quaternion, Vector3 } from 'three'
import type { Object3D } from 'three'
import type { VictoryContext } from './types'
import { ease } from './resources'
import { localToHead, reachVictoryHand } from './pose'

export function holdVictoryBook(context: VictoryContext): Object3D | undefined {
  const { hero, age, save } = context
  const book = hero.root.getObjectByName('chrollo-open-book')
  if (!book) return undefined
  save(book)
  book.visible = true
  const closed = hero.root.getObjectByName('chrollo-closed-book')
  if (closed) {
    save(closed)
    closed.visible = false
  }
  const lower = ease((age - 432) / 48),
    close = ease((age - 366) / 24)
  reachVictoryHand(context, {
    side: 'right',
    target: localToHead(hero, new Vector3(0.14, -0.47 - lower * 0.35, 0.29 - lower * 0.1)),
  })
  const headRotation = hero.head.getWorldQuaternion(new Quaternion())
  const orientation = new Quaternion()
    .setFromEuler(new Euler(0, (-close * Math.PI) / 2, 0))
    .multiply(new Quaternion().setFromEuler(new Euler(Math.PI / 2, 0, 0)))
  book.position.set(-0.025, 0.02, 0.025)
  book.quaternion.copy(
    book
      .parent!.getWorldQuaternion(new Quaternion())
      .invert()
      .multiply(headRotation)
      .multiply(orientation),
  )
  for (const side of [-1, 1]) {
    const leaf = book.getObjectByName(`book-leaf:${side}:combat-joint`)
    if (!leaf) continue
    save(leaf)
    leaf.rotation.z = side * (0.2 + close * (Math.PI / 2 - 0.2))
  }
  hero.root.updateWorldMatrix(true, true)
  if (age < 432)
    reachVictoryHand(context, {
      side: 'left',
      target: book
        .getWorldPosition(new Vector3())
        .add(new Vector3(-0.1 * (1 - close), 0.02, 0.02).applyQuaternion(headRotation)),
    })
  return book
}
