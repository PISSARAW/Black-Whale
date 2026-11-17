import * as THREE from 'three'
import { createKurapikaChainModel } from '../kurapikaChainModel'
import type { VictoryContext, VictoryDriver } from './types'
import { victoryActorShot, victoryPortrait, victoryShot, victoryWide } from './camera'
import {
  fallVictoryVictim,
  localToHead,
  reachVictoryHand,
  turnVictoryHero,
  victimTorso,
} from './pose'
import { ease } from './resources'

function scarletEyes(context: VictoryContext, material: THREE.Material) {
  for (const side of ['left', 'right']) {
    const iris = context.hero.head.getObjectByName(`face-eye-${side}`)?.getObjectByName('eye-pupil')
    if (iris instanceof THREE.Mesh) context.material(iris, material)
  }
}
function bindVictim(context: VictoryContext, chain: ReturnType<typeof createKurapikaChainModel>) {
  const centre = victimTorso(context),
    q = context.victim.root.getWorldQuaternion(new THREE.Quaternion())
  const radius = context.victim.width * 0.55 + 0.07 - ease((context.age - 235) / 20) * 0.04
  const start = context.hero.root
    .getObjectByName('hand-right')!
    .getWorldPosition(new THREE.Vector3())
  const points = [
    start,
    start
      .clone()
      .lerp(centre, 0.5)
      .add(new THREE.Vector3(0, -0.13, 0.18)),
  ]
  for (let i = 0; i <= 110; i++) {
    const t = i / 110,
      angle = t * Math.PI * 8
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * radius,
        (t - 0.5) * context.victim.height * 0.4,
        Math.sin(angle) * radius,
      )
        .applyQuaternion(q)
        .add(centre),
    )
  }
  const end = points.at(-1)!
  chain.draw({ points, stage: 2, direction: end.clone().sub(points.at(-2)!).normalize() })
  context.add(chain.root)
}
function kurapikaPose(context: VictoryContext) {
  const { age, hero, victim } = context
  turnVictoryHero(context)
  const lift = ease((age - 150) / 65) * Math.min(0.95, victim.height * 0.5)
  fallVictoryVictim(context, { start: 285, duration: 45, lift })
  const snap = ease((age - 235) / 20)
  reachVictoryHand(context, {
    side: 'right',
    target: localToHead(hero, new THREE.Vector3(0.18, -0.45 + snap * 0.1, 0.27 - snap * 0.1)),
  })
  if (age >= 420) victim.root.visible = false
}
function kurapikaCamera(context: VictoryContext) {
  if (context.age >= 360) {
    victoryPortrait(context)
    return
  }
  if (context.age >= 75 && context.age < 215) {
    victoryActorShot(context, context.victim)
    return
  }
  if (context.age < 75) {
    const hand = context.hero.root
      .getObjectByName('hand-right')!
      .getWorldPosition(new THREE.Vector3())
    victoryShot(context, {
      target: hand,
      offset: new THREE.Vector3(0.15, 0.1, 1.1),
      width: 0.7,
      height: 0.65,
    })
    return
  }
  victoryWide(context)
}
export function createKurapikaVictory(): VictoryDriver {
  const chain = createKurapikaChainModel(THREE),
    eyes = new THREE.MeshBasicMaterial({ color: 0xe42235 })
  return {
    update(context) {
      kurapikaPose(context)
      scarletEyes(context, eyes)
      if (context.age >= 75) bindVictim(context, chain)
      kurapikaCamera(context)
    },
    dispose() {
      chain.dispose()
      eyes.dispose()
    },
  }
}
