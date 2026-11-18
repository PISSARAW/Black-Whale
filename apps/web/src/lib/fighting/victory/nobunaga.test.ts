import { expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { createNobunagaFatalityActors } from '../../../../demos/fighting-showcase/nobunagaFatalityActors'
import { createNobunagaVictory } from './nobunaga'
import { resetVictoryActor, groundVictoryActor } from './actors'
import { victoryTransaction } from './transaction'
import { defaultFightComfort } from '../fightComfort'
import { hasVictoryCinematic } from './catalogue'
import { physicalJoints, physicalViolations, boneSnapshot } from '../physicalAuditTestKit'

const snapshot = (root: THREE.Object3D) => {
  const poses: unknown[] = []
  root.traverse((node) =>
    poses.push([
      node.uuid,
      node.position.toArray(),
      node.quaternion.toArray(),
      node.scale.toArray(),
      node.visible,
      node instanceof THREE.Mesh
        ? (Array.isArray(node.material) ? node.material : [node.material]).map((m) => m.uuid)
        : null,
    ]),
  )
  return poses
}
it.each(['hisoka', 'franklin', 'biscuit', 'nobunaga'] as const)(
  'responds exactly at En entry and cuts %s with the physical blade',
  (target) => {
    const actors = createNobunagaFatalityActors({
      target,
      glow: (color, opacity) =>
        new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 }),
    })
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.05, 50)
    scene.add(actors.hero.root, actors.victim.root)
    const before = snapshot(scene),
      sourceGeometry = new Set<THREE.BufferGeometry>()
    scene.traverse((node) => {
      if (node instanceof THREE.Mesh) sourceGeometry.add(node.geometry)
    })
    const spies = [...sourceGeometry].map((geometry) => vi.spyOn(geometry, 'dispose'))
    const driver = createNobunagaVictory()
    const joints = physicalJoints(scene),
      bones = boneSnapshot(joints)
    const previous = new Map<THREE.Object3D, THREE.Quaternion>()
    try {
      const frames =
        target === 'franklin'
          ? Array.from({ length: 600 }, (_, i) => i)
          : [0, 299, 300, 303, 308, 360, 390, 420, 462, 486, 510, 570]
      for (const age of frames) {
        const tx = victoryTransaction(camera)
        resetVictoryActor(actors.hero, tx.save)
        resetVictoryActor(actors.victim, tx.save)
        actors.hero.root.position.set(-2, 0, 0)
        actors.victim.root.position.set(3, 0, 0)
        groundVictoryActor(actors.hero)
        groundVictoryActor(actors.victim)
        const audit = driver.update({
          ...actors,
          scene,
          camera,
          age,
          centre: 0,
          gap: 5,
          comfort: defaultFightComfort(),
          save: tx.save,
          material: tx.material,
          defer: tx.defer,
          add(root) {
            scene.add(root)
            tx.defer(() => root.removeFromParent())
          },
        })
        if (age === 299) {
          expect(audit.entryDistance).toBeGreaterThan(4)
          expect(audit.dash).toBe(0)
        }
        if (age === 300) expect(audit.entryDistance).toBeCloseTo(4, 5)
        if (age === 308) {
          expect(audit.contactError).toBeLessThan(0.00001)
          expect(audit.drawn).toBe(true)
        }
        if (age === 486) expect(audit.tipToMouth).toBeLessThan(0.03)
        if (age === 510) expect(audit.drawn).toBe(false)
        if (age >= 390) expect(actors.victim.root.visible).toBe(false)
        audit.gripErrors.forEach((error, i) =>
          expect(error, `age ${age}, hand ${i}, ${audit.gripErrors}`).toBeLessThan(0.18),
        )
        expect(physicalViolations(physicalJoints(scene)), `age ${age}`).toEqual([])
        expect(boneSnapshot(joints), `age ${age}`).toEqual(bones)
        if (target === 'franklin')
          for (const { node } of joints) {
            const last = previous.get(node)
            if (last)
              expect(node.quaternion.angleTo(last), `age ${age}, ${node.name}`).toBeLessThan(0.65)
            previous.set(node, node.quaternion.clone())
          }
        tx.restore()
        expect(snapshot(scene)).toEqual(before)
      }
    } finally {
      driver.dispose()
    }
    spies.forEach((spy) => {
      expect(spy).not.toHaveBeenCalled()
      spy.mockRestore()
    })
  },
)
it('keeps Nobunaga out of the playable victory catalogue', () => {
  expect(hasVictoryCinematic('hisoka')).toBe(true)
  expect((hasVictoryCinematic as (id: string) => boolean)('nobunaga')).toBe(false)
})
