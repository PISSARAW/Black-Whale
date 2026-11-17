import { expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from '../fighterFigure'
import { createFight } from '../engine'
import { fightBodyMotion } from '../fightBodyMotion'
import { defaultFightComfort } from '../fightComfort'
import { createVictoryRenderer } from './renderer'
import { selectVictory } from './catalogue'
function snapshot(scene: THREE.Object3D) {
  const values: unknown[] = []
  scene.traverse((n) =>
    values.push([
      n.uuid,
      ...n.position.toArray(),
      ...n.quaternion.toArray(),
      ...n.scale.toArray(),
      n.visible,
      n instanceof THREE.Mesh
        ? (Array.isArray(n.material) ? n.material : [n.material]).map((m) => m.uuid)
        : null,
    ]),
  )
  return JSON.stringify(values)
}
it.each(['franklin', 'kalluto', 'melody'] as const)(
  'keeps the native flute, listener and arena intact against %s',
  (target) => {
    for (const side of ['player', 'opponent'] as const) {
      const state = {
        ...createFight(
          side === 'player' ? 'melody' : target,
          side === 'player' ? target : 'melody',
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
        source = JSON.stringify(state),
        renderer = createVictoryRenderer({ scene, scenery, camera })
      try {
        for (const age of [0, 48, 144, 210, 324, 408, 570]) {
          const restore = renderer.apply({
            state,
            models,
            comfort: defaultFightComfort(),
            frame: { ...selectVictory(state)!, elapsed: age / 60, active: true },
          })!
          const audit = scene.userData.melodyVictory
          audit.grips.forEach((error: number) =>
            expect(error, `${target} at ${age}`).toBeLessThan(0.045),
          )
          if (age >= 48) expect(audit.fluteContact).toBeLessThan(1e-5)
          if (age >= 234) expect(audit.peace).toBe(1)
          if (age >= 240) expect(audit.growth).toBe(1)
          expect(audit.nonlethal).toBe(true)
          restore()
          expect(snapshot(scene)).toBe(before)
          expect(JSON.stringify(state)).toBe(source)
        }
      } finally {
        renderer.dispose()
      }
    }
  },
)
