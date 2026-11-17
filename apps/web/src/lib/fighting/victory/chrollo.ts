import { Euler, Quaternion, Vector3 } from 'three'
import type { Object3D } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { createChrolloSpectacleBlast } from './blast'
import { disposeVictoryObject, ease } from './resources'
import { fallVictoryVictim, localToHead, reachVictoryHand, turnVictoryHero } from './pose'
import { groundVictoryActor } from './actors'
import { victoryActorShot, victoryPortrait, victoryShot, victoryWide } from './camera'

function holdVictoryBook(context: VictoryContext): Object3D | undefined {
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
  const lower = ease((age - 240) / 60),
    close = ease((age - 150) / 30)
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
  if (age < 285)
    reachVictoryHand(context, {
      side: 'left',
      target: book
        .getWorldPosition(new Vector3())
        .add(new Vector3(-0.1 * (1 - close), 0.02, 0.02).applyQuaternion(headRotation)),
    })
  return book
}
function walkFromVictoryBlast(context: VictoryContext) {
  const walk = ease((context.age - 300) / 120)
  const stride = Math.sin(walk * Math.PI * 4)
  context.hero.root.position.z += walk * 0.6
  for (const [side, sign] of [
    ['left', 1],
    ['right', -1],
  ] as const) {
    context.hero.root.getObjectByName(`hip-${side}`)!.rotation.x = stride * sign * 0.25
    context.hero.root.getObjectByName(`knee-${side}`)!.rotation.x =
      Math.max(0, -stride * sign) * 0.35
  }
  groundVictoryActor(context.hero)
}
export function createChrolloVictory(): VictoryDriver {
  const blast = createChrolloSpectacleBlast()
  return {
    update(context) {
      turnVictoryHero(context, 300)
      walkFromVictoryBlast(context)
      const book = holdVictoryBook(context)
      fallVictoryVictim(context, { start: 180, duration: 65 })
      if (context.age >= 420) context.victim.root.visible = false
      blast.sync(
        new Vector3(context.victim.root.position.x, context.victim.height * 0.6, -0.15),
        context.age,
      )
      context.add(blast.group)
      if (context.age >= 420) {
        victoryPortrait(context)
        return
      }
      if (context.age < 75) {
        victoryActorShot(context, context.victim)
        return
      }
      if (context.age < 180 && book) {
        victoryShot(context, {
          target: book.getWorldPosition(new Vector3()),
          offset: localToHead(context.hero, new Vector3(0, 0.05, 1)).sub(
            context.hero.head.getWorldPosition(new Vector3()),
          ),
          width: 0.8,
          height: 0.65,
        })
        return
      }
      victoryWide(context)
    },
    dispose() {
      disposeVictoryObject(blast.group)
    },
  }
}
