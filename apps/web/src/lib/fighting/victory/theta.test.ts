import { expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from '../fighterFigure'
import { createFight } from '../engine'
import { fightBodyMotion } from '../fightBodyMotion'
import { defaultFightComfort } from '../fightComfort'
import { createVictoryRenderer } from './renderer'
import { selectVictory } from './catalogue'
import { createThetaFilm } from '../../../../demos/fighting-showcase/thetaFatalityFilm'

function snapshot(root: THREE.Object3D) {
  const values: unknown[] = []
  root.traverse((node) =>
    values.push([
      node.uuid,
      ...node.position.toArray(),
      ...node.quaternion.toArray(),
      ...node.scale.toArray(),
      node.visible,
    ]),
  )
  return JSON.stringify(values)
}
it.each(['player', 'opponent'] as const)('proves a physical-pistol knockout on %s', (side) => {
  const film = createThetaFilm({ side })
  expect(film.state.winner).toBe(side)
  expect(film.report.physicalBullet).toBe(true)
  expect(film.report.inventedHatsu).toBe(false)
  expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
})
it.each(['franklin', 'biscuit', 'theta'] as const)(
  'keeps Theta’s weapon, reach and fall physical against %s',
  (target) => {
    const state = {
      ...createFight('theta', target),
      phase: 'finished' as const,
      winner: 'player' as const,
    }
    const build = (side: 'player' | 'opponent') => {
      const fighter = state[side]
      const model = buildFightFigure({
        THREE,
        glow: (color) => new THREE.MeshBasicMaterial({ color }),
        fighter,
      })
      model.animate(0, 'idle', { motion: fightBodyMotion({ fighter, seconds: 0, progress: 0 }) })
      return model.root
    }
    const models = { player: build('player'), opponent: build('opponent') }
    const scene = new THREE.Scene(),
      scenery = new THREE.Group(),
      camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.1, 50)
    scene.add(scenery, models.player, models.opponent)
    const before = snapshot(scene),
      source = JSON.stringify(state)
    const renderer = createVictoryRenderer({ scene, scenery, camera })
    try {
      for (const age of [
        0, 54, 84, 120, 180, 228, 252, 288, 360, 372, 390, 408, 480, 570, 84, 390,
      ]) {
        const restore = renderer.apply({
          state,
          models,
          comfort: defaultFightComfort(),
          frame: { ...selectVictory(state)!, active: true, elapsed: age / 60 },
        })!
        const audit = scene.userData.thetaVictory
        const gun = scene.getObjectByName('theta-last-chamber')!.children[0]
        const wrist = models.player.getObjectByName('hand-right')!
        expect(
          gun
            .getWorldPosition(new THREE.Vector3())
            .distanceTo(wrist.getWorldPosition(new THREE.Vector3())),
        ).toBeLessThan(1e-9)
        expect(
          new THREE.Vector3(0, 0, 1)
            .applyQuaternion(gun.getWorldQuaternion(new THREE.Quaternion()))
            .dot(
              new THREE.Vector3(0, -1, 0).applyQuaternion(
                wrist.getWorldQuaternion(new THREE.Quaternion()),
              ),
            ),
        ).toBeCloseTo(1, 9)
        expect(audit.shots).toBe(Number(age >= 372))
        expect(audit.chambered).toBe(age < 372)
        expect(audit.magazineRemoved).toBe(age >= 54)
        if (age === 372)
          expect(
            audit.target.clone().sub(audit.muzzle).normalize().dot(audit.barrelDirection),
          ).toBeGreaterThan(0.99)
        expect(
          Math.max(...audit.handErrors),
          `target ${target}, age ${age}, hands ${audit.handErrors}`,
        ).toBeLessThan(0.06)
        if (age >= 120) expect(audit.magazine.y).toBeCloseTo(0.04, 3)
        if (age === 570) expect(audit.fall.floor).toBeCloseTo(0.012, 5)
        restore()
        expect(snapshot(scene)).toBe(before)
        expect(JSON.stringify(state)).toBe(source)
      }
    } finally {
      renderer.dispose()
    }
  },
)
