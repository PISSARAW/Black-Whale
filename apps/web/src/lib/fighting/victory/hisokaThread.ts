import { CatmullRomCurve3, Group, Mesh, MeshBasicMaterial, TubeGeometry, Vector3 } from 'three'
import type { VictoryDriver } from './types'
import { createVictoryCard } from './card'
import { createVictorySmile } from './smile'
import { disposeVictoryObject, ease } from './resources'
import {
  fallVictoryVictim,
  localToHead,
  reachVictoryHand,
  turnVictoryHero,
  victimTorso,
} from './pose'
import { victoryPortrait, victoryShot, victoryWide } from './camera'

export function createHisokaThreadVictory(): VictoryDriver {
  const root = new Group(),
    card = createVictoryCard()
  const smile = createVictorySmile()
  const gum = new Mesh(
    new TubeGeometry(new CatmullRomCurve3([new Vector3(), new Vector3(1, 0, 0)]), 1, 0.009, 6),
    new MeshBasicMaterial({ color: 0xef83c6 }),
  )
  root.add(gum, card)
  return {
    update(context) {
      const { age, hero, victim } = context
      turnVictoryHero(context, 270)
      const recall = ease((age - 120) / 90)
      victim.root.position.x -= context.gap * 0.38 * recall
      fallVictoryVictim(context, { start: 210, duration: 55 })
      const hand = localToHead(hero, new Vector3(0.2, -0.43, 0.25 - recall * 0.12))
      if (age >= 270)
        hand.copy(
          localToHead(hero, new Vector3(0.12, -0.36 + ease((age - 270) / 100) * 0.18, 0.29)),
        )
      reachVictoryHand(context, { side: 'right', target: hand })
      hero.root.updateWorldMatrix(true, true)
      const grip = hero.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
      const target = victimTorso(context)
      gum.visible = age < 270
      if (gum.visible) {
        gum.geometry.dispose()
        const mid = grip.clone().lerp(target, 0.5)
        mid.y -= (1 - recall) * 0.13
        gum.geometry = new TubeGeometry(new CatmullRomCurve3([grip, mid, target]), 32, 0.009, 6)
      }
      card.visible = age >= 270
      card.position.copy(grip).add(new Vector3(0, 0.04, 0.035))
      card.quaternion.copy(hero.head.getWorldQuaternion(card.quaternion))
      card.rotateZ(-0.14)
      if (age >= 270) smile.apply(context)
      if (age >= 420) victim.root.visible = false
      context.add(root)
      if (age >= 270) victoryPortrait(context)
      else if (age >= 60 && age < 120)
        victoryShot(context, {
          target: grip,
          offset: new Vector3(0.15, 0.1, 1.4),
          width: 0.9,
          height: 0.8,
        })
      else victoryWide(context)
    },
    dispose() {
      disposeVictoryObject(root)
      smile.dispose()
    },
  }
}
