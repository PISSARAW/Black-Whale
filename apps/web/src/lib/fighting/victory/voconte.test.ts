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
it.each(['franklin', 'kalluto', 'voconte'] as const)(
  'uses one real body per actor, an anchored elevated exit and a native fall trap against %s, then restores the scene',
  (target) => {
    for (const side of ['player', 'opponent'] as const) {
      const state = {
        ...createFight(
          side === 'player' ? 'voconte' : target,
          side === 'player' ? target : 'voconte',
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
      const fog = new THREE.Fog(0x05080b, 3, 12)
      scene.fog = fog
      scene.add(scenery, models.player, models.opponent)
      const before = snapshot(scene),
        source = JSON.stringify(state)
      const renderer = createVictoryRenderer({ scene, scenery, camera })
      try {
        for (const age of [
          0, 30, 48, 89, 90, 95, 96, 120, 155, 156, 161, 162, 186, 210, 245, 246, 251, 252, 300,
          360, 420, 468, 570,
        ]) {
          const restore = renderer.apply({
            state,
            models,
            comfort: defaultFightComfort(),
            frame: { ...selectVictory(state)!, elapsed: age / 60, active: true },
          })!
          const audit = scene.userData.voconteVictory
          expect(audit).toBeDefined()
          expect(
            Math.max(...audit.grips),
            `${target}, ${side}, frame ${age}: ${audit.grips}`,
          ).toBeLessThan(0.06)
          expect(audit.hidden).toBe([156, 161].includes(age))
          expect(audit.heroHidden).toBe([90, 95, 246, 251].includes(age))
          expect(audit.doorB[0] - audit.doorA[0]).toBeCloseTo(2.6)
          expect(audit.doorA[1]).toBe(0)
          expect(audit.doorB[1]).toBe(audit.elevation)
          expect(audit.elevation).toBeGreaterThan(2)
          if (age === 162) expect(audit.victimY).toBeGreaterThanOrEqual(audit.elevation)
          if (age === 570) {
            expect(audit.landed).toBe(true)
            expect(audit.floor).toBeCloseTo(0.012, 5)
            expect(audit.heroPassage).toBe(2)
          }
          restore()
          expect(scene.fog).toBe(fog)
          expect(snapshot(scene)).toEqual(before)
          expect(JSON.stringify(state)).toBe(source)
        }
      } finally {
        renderer.dispose()
      }
    }
  },
)
