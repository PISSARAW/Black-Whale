import { cinematicChainSteel } from './kurapikaSteel'
import * as THREE from 'three'
import { createKurapikaChainModel } from '../../src/lib/fighting/kurapikaChainModel'
import type { FightState } from '../../src/lib/fighting/types'

const smooth = (v: number) => {
  const t = Math.max(0, Math.min(1, v))
  return t * t * (3 - 2 * t)
}

/** Reuse the game's individual steel links and claw, following the actual hand and captive's torso. */
export function createVictoryJail() {
  const model = createKurapikaChainModel(THREE)
  model.root.name = 'kurapika-cinematic-jail'
  const steel = cinematicChainSteel()
  model.root.traverse((node) => {
    if (node instanceof THREE.Mesh) node.material = steel
  })
  const sparkMaterial = new THREE.MeshBasicMaterial({
    color: 0xffedba,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const sparks = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.006, 0.048, 0.006),
    sparkMaterial,
    24,
  )
  sparks.frustumCulled = false
  model.root.add(sparks)
  const dummy = new THREE.Object3D()
  return {
    root: model.root,
    sync(options: {
      hero: THREE.Object3D
      victim: THREE.Object3D
      age: number
      state: FightState
      fatality?: boolean
    }) {
      const { hero, victim, age, state, fatality } = options
      model.hide()
      model.root.visible =
        age >= (fatality ? 0 : 90) && age < 360 && (age < 90 || Boolean(state.opponent.chainJail))
      if (!model.root.visible) return { linkCount: 0, wraps: 0 }
      const hand = hero.getObjectByName('hand-right')!
      const start = hand.localToWorld(new THREE.Vector3(0.006, -0.074, 0.025))
      const chest = victim.getObjectByName('torso')!
      const centre = chest.localToWorld(new THREE.Vector3(0, 0, 0.06))
      const rotation = chest.getWorldQuaternion(new THREE.Quaternion())
      if (fatality && age < 90) {
        const cast = smooth((age - 45) / 45)
        const hanging = start.clone().add(new THREE.Vector3(0, -0.45, 0.08))
        const end = hanging.lerp(centre, cast)
        const middle = start.clone().lerp(end, 0.5)
        middle.z += 0.08
        model.draw({
          points: [start, middle, end],
          stage: 2,
          direction: end.clone().sub(middle).normalize(),
        })
        sparks.visible = false
        return { linkCount: model.links[2].count, wraps: 0 }
      }
      const tighten = smooth((age - 90) / 40)
      const slack = smooth((age - (fatality ? 330 : 245)) / 90)
      const bend = start.clone().lerp(centre, 0.46)
      bend.y = Math.max(0.055, bend.y - 0.08 - slack * 1.5)
      bend.z += 0.16
      const points = [start, bend]
      const turns = 0.15 + tighten * (fatality ? 3.85 : 2.85)
      for (let i = 0; i <= 72; i++) {
        const t = i / 72,
          a = t * Math.PI * 2 * turns
        const radius = 0.36 - tighten * 0.07 - (fatality ? smooth((age - 235) / 20) * 0.085 : 0)
        points.push(
          new THREE.Vector3(Math.cos(a) * radius, -0.36 + t * 0.75, Math.sin(a) * (radius - 0.05))
            .applyQuaternion(rotation)
            .add(centre),
        )
      }
      const last = points.at(-1)!.clone()
      model.draw({ points, stage: 2, direction: last.clone().sub(points.at(-2)!).normalize() })
      model.tips[2].scale.setScalar(0.75)
      const snapAge = fatality ? 255 : 180
      const since = age < snapAge ? (age - 90) / 60 : (age - snapAge) / 60
      sparks.visible = since >= 0 && since < 0.55
      sparkMaterial.opacity = Math.max(0, 1 - since / 0.55) * 0.85
      for (let i = 0; i < 24; i++) {
        const a = i * 2.39996
        dummy.position
          .copy(centre)
          .add(
            new THREE.Vector3(
              Math.cos(a) * (0.28 + since * 0.5),
              Math.sin(a) * (0.3 + since * 0.5),
              0.25 + Math.sin(i) * 0.07,
            ),
          )
        dummy.rotation.set(0, 0, -a)
        dummy.scale.setScalar(Math.max(0, 1 - since / 0.6))
        dummy.updateMatrix()
        sparks.setMatrixAt(i, dummy.matrix)
      }
      sparks.instanceMatrix.needsUpdate = true
      return { linkCount: model.links[2].count, wraps: turns }
    },
  }
}
