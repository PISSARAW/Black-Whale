import * as THREE from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import type { KurapikaTroupePose } from './kurapikaTroupePose'
import { kurapikaTroupePose, TROUPE_BREACH } from './kurapikaTroupePose'
import { createKurapikaTroupeChains } from './kurapikaTroupeChains'
import { scarletEyes } from './kurapikaEyes'
import { createKurapikaTroupeExpression } from './kurapikaTroupeExpression'
import { troupeMember } from '../troupeMembership'
import { victoryPortrait, victoryShot } from './camera'
import { visibleVictoryBounds } from './bodyBounds'
import { disposeVictoryObject, ease } from './resources'

function troupeWide(context: VictoryContext) {
  const { hero, victim } = context
  const bounds = visibleVictoryBounds(hero.root).union(visibleVictoryBounds(victim.root))
  const fixed = context.comfort.camera === 0
  victoryShot(context, {
    target: fixed
      ? new THREE.Vector3(context.centre + 0.8, Math.max(hero.height, victim.height) * 0.5, 0)
      : bounds.getCenter(new THREE.Vector3()),
    offset: new THREE.Vector3(0.35, 0.25, 5),
    width: fixed ? context.gap + victim.height + 3.2 : bounds.getSize(new THREE.Vector3()).x + 1,
    height: Math.max(hero.height, victim.height) + 0.8,
  })
}
function troupeCamera(context: VictoryContext, pose: KurapikaTroupePose) {
  const { age } = context
  if (
    context.comfort.camera === 0 ||
    (age >= TROUPE_BREACH && age < 420) ||
    (age >= 33 && age < 78)
  ) {
    troupeWide(context)
    return
  }
  if (age < 33 || age >= 420) {
    victoryPortrait(context)
    return
  }
  victoryShot(context, {
    target: pose.contact
      .clone()
      .lerp(context.hero.head.getWorldPosition(new THREE.Vector3()), 0.25),
    offset: new THREE.Vector3(0.2, 0.12, 3),
    width: pose.punch.zone === 'head' ? 1.9 : 2.4,
    height: pose.punch.zone === 'head' ? 1.4 : 1.7,
  })
}
export function createKurapikaTroupeVictory(): VictoryDriver {
  const chains = createKurapikaTroupeChains(),
    expression = createKurapikaTroupeExpression()
  const eyes = new THREE.MeshBasicMaterial({ color: 0xe42235 })
  const root = new THREE.Group()
  root.name = 'kurapika-troupe-impact-cuts'
  const material = new THREE.LineBasicMaterial({ color: 0xe5d2b9, transparent: true, opacity: 0.6 })
  const rays = Array.from(
    { length: 10 },
    () => new THREE.Line(new THREE.BufferGeometry(), material),
  )
  root.add(...rays)
  return {
    update(context) {
      if (!troupeMember(context.state[context.frame.loser].id))
        throw new Error('Chain Jail requires a Phantom Troupe member')
      const pose = kurapikaTroupePose(context)
      const jail = chains.sync(context, pose)
      scarletEyes(context, eyes)
      expression.sync(context)
      troupeCamera(context, pose)
      const t = (context.age - pose.punch.frame) / 8
      root.visible = t >= 0 && t < 1
      material.opacity = (context.comfort.flashes ? 0.7 : 0.25) * (1 - ease(t))
      rays.forEach((ray, i) => {
        const a = (i * Math.PI) / 5,
          start = pose.contact
            .clone()
            .add(new THREE.Vector3(Math.cos(a) * 0.07, Math.sin(a) * 0.07, 0.03))
        ray.geometry.setFromPoints([
          start,
          start
            .clone()
            .add(
              new THREE.Vector3(Math.cos(a) * (0.15 + t * 0.1), Math.sin(a) * (0.15 + t * 0.1), 0),
            ),
        ])
      })
      context.add(expression.root)
      context.add(chains.root)
      context.add(root)
      context.scene.userData.kurapikaTroupeVictory = {
        jail,
        bound: pose.jail,
        punch: pose.punch.frame,
        side: pose.punch.side,
        extension: pose.extension,
        contactError: pose.contactError,
        fist: pose.fist.toArray(),
        contact: pose.contact.toArray(),
        originMiddle: pose.middle.toArray(),
        floor: pose.fall?.floor,
        upY: pose.fall?.upY,
      }
      context.defer(() => {
        delete context.scene.userData.kurapikaTroupeVictory
      })
    },
    dispose() {
      chains.dispose()
      expression.dispose()
      eyes.dispose()
      disposeVictoryObject(root)
    },
  }
}
