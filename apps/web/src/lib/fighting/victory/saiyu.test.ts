import { expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from '../fighterFigure'
import { createFight } from '../engine'
import { fightBodyMotion } from '../fightBodyMotion'
import { defaultFightComfort } from '../fightComfort'
import { createVictoryRenderer } from './renderer'
import { selectVictory } from './catalogue'
import { SAIYU_CONTACTS } from './saiyuPose'

function snapshot(root: THREE.Object3D) {
  const all: unknown[] = []
  root.traverse((node) =>
    all.push([
      node.uuid,
      ...node.position.toArray(),
      ...node.quaternion.toArray(),
      ...node.scale.toArray(),
      node.visible,
      node instanceof THREE.Mesh
        ? (Array.isArray(node.material) ? node.material : [node.material]).map((m) => m.uuid)
        : null,
    ]),
  )
  return JSON.stringify(all)
}
it.each(['franklin', 'kalluto', 'saiyu'] as const)(
  'contacts the actual senses and staff against %s, then restores the scene',
  (target) => {
    for (const side of ['player', 'opponent'] as const) {
      const state = {
        ...createFight(side === 'player' ? 'saiyu' : target, side === 'player' ? target : 'saiyu'),
        phase: 'finished' as const,
        winner: side,
      }
      const build = (fighter: typeof state.player) => {
        const m = buildFightFigure({
          THREE,
          glow: (color, opacity = 1) =>
            new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 }),
          fighter,
        })
        m.animate(0, 'idle', { motion: fightBodyMotion({ fighter, seconds: 0, progress: 0 }) })
        return m.root
      }
      const models = { player: build(state.player), opponent: build(state.opponent) }
      const scene = new THREE.Scene(),
        scenery = new THREE.Group(),
        camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.1, 50)
      scene.add(scenery, models.player, models.opponent)
      const before = snapshot(scene),
        source = JSON.stringify(state)
      const renderer = createVictoryRenderer({ scene, scenery, camera })
      try {
        for (const age of [
          0,
          42,
          ...SAIYU_CONTACTS,
          140,
          174,
          246,
          270,
          312,
          348,
          360,
          390,
          438,
          570,
        ]) {
          const restore = renderer.apply({
            state,
            models,
            comfort: defaultFightComfort(),
            frame: { ...selectVictory(state)!, elapsed: age / 60, active: true },
          })!
          const audit = scene.userData.saiyuVictory
          const index = SAIYU_CONTACTS.indexOf(age as (typeof SAIYU_CONTACTS)[number])
          if (index >= 0) expect(audit.seals[index]).toBeLessThan(1e-6)
          audit.grips.forEach((error: number) =>
            expect(error, `${target}, ${side}, frame ${age}`).toBeLessThan(0.035),
          )
          if (age === 140) expect(audit.blind).toBe(true)
          if (age === 246 || age === 270) {
            expect(audit.mouthOpening).toBeGreaterThan(0.95)
            expect(scene.getObjectByName('silent-open-mouth')?.parent?.visible).toBe(true)
          }
          if (age === 360) expect(audit.contactError).toBeLessThan(1e-6)
          if (age === 570) {
            expect(audit.floor).toBeCloseTo(0.012, 5)
            expect(Math.abs(audit.upY)).toBeLessThan(0.15)
          }
          restore()
          expect(snapshot(scene)).toEqual(before)
          expect(JSON.stringify(state)).toBe(source)
        }
      } finally {
        renderer.dispose()
      }
    }
  },
)
