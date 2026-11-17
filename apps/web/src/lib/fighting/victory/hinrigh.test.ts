import { expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from '../fighterFigure'
import { createFight } from '../engine'
import { fightBodyMotion } from '../fightBodyMotion'
import { defaultFightComfort } from '../fightComfort'
import { createVictoryRenderer } from './renderer'
import { selectVictory } from './catalogue'

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
it.each(['franklin', 'kalluto', 'hinrigh'] as const)(
  'locks the actual wrists and ankles against %s, then restores the scene',
  (target) => {
    for (const side of ['player', 'opponent'] as const) {
      const state = {
        ...createFight(
          side === 'player' ? 'hinrigh' : target,
          side === 'player' ? target : 'hinrigh',
        ),
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
        for (const age of [0, 30, 54, 78, 120, 174, 222, 282, 348, 360, 390, 438, 486, 570]) {
          const restore = renderer.apply({
            state,
            models,
            comfort: defaultFightComfort(),
            frame: { ...selectVictory(state)!, elapsed: age / 60, active: true },
          })!
          const audit = scene.userData.hinrighVictory
          expect(audit).toBeDefined()
          audit.cuffErrors.forEach((error: number) => expect(error).toBeLessThan(1e-6))
          if ([30, 54, 78].includes(age))
            expect(audit.touchError, `${target}, frame ${age}`).toBeLessThan(0.05)
          if (age >= 486) expect(audit.petError, `${target}, frame ${age}`).toBeLessThan(0.05)
          if (age === 120) expect(audit.snakeSpan).toBeLessThan(0.7)
          if (age === 360) expect(audit.shotError).toBeLessThan(1e-6)
          expect(audit.fired).toBe(age >= 360)
          expect(audit.nativeBodyIntact).toBe(true)
          if (age === 570) expect(audit.floor).toBeCloseTo(0.012, 5)
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
