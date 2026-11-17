import {
  AdditiveBlending,
  ConeGeometry,
  CylinderGeometry,
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  SphereGeometry,
  Vector3,
} from 'three'
import type { VictoryShot } from './types'
import type { GunPose } from './types'

function shotTiming(age: number, shot: VictoryShot, flashes = true) {
  const elapsed = age - shot.emission
  const travel = Math.max(5, (shot.impact ?? shot.emission + 18) - shot.emission)
  return {
    elapsed,
    phase: Math.max(0, Math.min(1, elapsed / travel)),
    flying: elapsed >= 0 && elapsed < travel && age < 351,
    muzzle: elapsed >= 0 && elapsed < 2.6 && age < 350 && flashes,
  }
}
function impactTiming(age: number, shot: VictoryShot, flashes = true) {
  const elapsed = shot.impact === null ? -1 : age - shot.impact
  return {
    elapsed,
    size: elapsed >= 0 && elapsed < 5 && flashes ? 0.075 * (1 - elapsed / 5) : 0,
    mark: elapsed >= 0 && age < 420,
    spark: elapsed >= 0 && elapsed < 24 && age < 420,
  }
}

export function createFranklinBarrageEffects(shots: VictoryShot[]) {
  const root = new Group()
  root.name = 'franklin-cinematic-barrage'
  const tracer = new InstancedMesh(
    new CylinderGeometry(0.012, 0.012, 0.28, 6),
    new MeshBasicMaterial({ color: 0xffeccd }),
    shots.length,
  )
  const aura = new InstancedMesh(
    new CylinderGeometry(0.025, 0.025, 0.34, 6),
    new MeshBasicMaterial({
      color: 0xff4939,
      transparent: true,
      opacity: 0.48,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    shots.length,
  )
  const flash = new InstancedMesh(
    new ConeGeometry(0.04, 0.16, 5),
    new MeshBasicMaterial({
      color: 0xffc38a,
      transparent: true,
      opacity: 0.9,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    shots.length,
  )
  const hit = new InstancedMesh(
    new SphereGeometry(1, 8, 5),
    new MeshBasicMaterial({
      color: 0xffdeac,
      transparent: true,
      opacity: 0.8,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    shots.length,
  )
  const sparks = new InstancedMesh(
    new SphereGeometry(0.007, 4, 3),
    new MeshBasicMaterial({ color: 0xffa67d }),
    shots.length * 7,
  )
  const marks = new InstancedMesh(
    new SphereGeometry(1, 8, 6),
    new MeshBasicMaterial({ color: 0x39232a }),
    shots.length,
  )
  for (const mesh of [tracer, aura, flash, hit, sparks, marks]) mesh.frustumCulled = false
  root.add(tracer, aura, flash, hit, sparks, marks)
  const dummy = new Object3D(),
    axis = new Vector3(0, 1, 0)
  return {
    root,
    sync(options: { age: number; pose: GunPose; flashes?: boolean }) {
      const { age, pose } = options
      const front = new Vector3(0, 0, 1).applyQuaternion(pose.victim.quaternion)
      const centre = pose.victim.getObjectByName('torso')!.getWorldPosition(new Vector3())
      const hits: Vector3[] = []
      shots.forEach((shot, i) => {
        const finger = (i % 2) * 5 + (Math.floor(i / 2) % 5)
        const origin = pose.muzzles[finger]
        const direction = pose.directions[finger]
        const surface = centre.clone().addScaledVector(front, 0.113)
        const distance = surface.sub(origin).dot(front) / direction.dot(front)
        const target = origin
          .clone()
          .addScaledVector(direction, Math.max(0.3, Math.min(5, distance)))
        hits.push(target)
        const { elapsed, flying, phase, muzzle } = shotTiming(age, shot, options.flashes)
        const contact = impactTiming(age, shot, options.flashes)
        dummy.position.copy(origin).lerp(target, phase)
        dummy.quaternion.setFromUnitVectors(axis, direction)
        dummy.scale.setScalar(flying ? 1 : 0)
        dummy.updateMatrix()
        tracer.setMatrixAt(i, dummy.matrix)
        aura.setMatrixAt(i, dummy.matrix)
        dummy.position.copy(origin).addScaledVector(direction, 0.075)
        dummy.scale.setScalar(muzzle ? 1.1 - elapsed * 0.2 : 0)
        dummy.updateMatrix()
        flash.setMatrixAt(i, dummy.matrix)
        const sinceImpact = contact.elapsed
        dummy.position.copy(target)
        dummy.quaternion.identity()
        const size = contact.size
        dummy.scale.set(size, size * 0.7, size)
        dummy.updateMatrix()
        hit.setMatrixAt(i, dummy.matrix)
        dummy.position.copy(target).addScaledVector(front, 0.003)
        dummy.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), front)
        const mark = contact.mark ? 0.012 + (i % 3) * 0.003 : 0
        dummy.scale.set(mark, mark * 0.75, mark * 0.25)
        dummy.updateMatrix()
        marks.setMatrixAt(i, dummy.matrix)
        for (let j = 0; j < 7; j++) {
          const a = j * 2.39996 + i,
            t = Math.max(0, sinceImpact / 60)
          dummy.position
            .copy(target)
            .add(
              new Vector3(
                -t * (0.6 + j * 0.13),
                Math.sin(a) * t * 1.8 - t * t * 2,
                Math.cos(a) * t * 1.4,
              ),
            )
          dummy.scale.setScalar(contact.spark ? 1 - t * 1.6 : 0)
          dummy.updateMatrix()
          sparks.setMatrixAt(i * 7 + j, dummy.matrix)
        }
      })
      for (const mesh of [tracer, aura, flash, hit, sparks, marks])
        mesh.instanceMatrix.needsUpdate = true
      return {
        visibleBulletCount: shots.filter(
          (s) => age >= s.emission && age < (s.impact ?? s.emission + 18) && age < 351,
        ).length,
        completedImpacts: shots.filter((s) => s.impact !== null && age >= s.impact).length,
        impactPositions: hits.slice(0, 2).map((p) => p.toArray()),
      }
    },
  }
}
