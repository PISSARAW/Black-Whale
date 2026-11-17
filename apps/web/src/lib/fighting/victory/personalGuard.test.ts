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
it.each(['longhi', 'furykov'] as const)(
  'adapts %s to real targets and restores every native pose and material',
  (hero) => {
    for (const target of ['franklin', 'kalluto', hero] as const) {
      for (const side of ['player', 'opponent'] as const) {
        const state = {
          ...createFight(side === 'player' ? hero : target, side === 'player' ? target : hero),
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
            0, 60, 108, 144, 180, 204, 228, 252, 282, 318, 372, 414, 415, 468, 510, 570,
          ]) {
            const restore = renderer.apply({
              state,
              models,
              comfort: defaultFightComfort(),
              frame: { ...selectVictory(state)!, elapsed: age / 60, active: true },
            })!
            const audit = scene.userData[hero + 'Victory']
            expect(audit).toBeDefined()
            if (audit.handErrors.length)
              expect(
                Math.max(...audit.handErrors),
                `${hero}, ${target}, ${side}, frame ${age}`,
              ).toBeLessThan(0.06)
            if (age >= 414) expect(audit.hits).toBe(hero === 'furykov' ? 3 : 5)
            if (age === 570) expect(audit.fall.floor).toBeCloseTo(0.012, 5)
            if (hero === 'longhi' && age === 204) expect(audit.noContractDamage).toBe(true)
            if (hero === 'furykov') expect(audit.automaticDodge).toBe(false)
            restore()
            expect(scene.fog).toBe(fog)
            expect(snapshot(scene)).toEqual(before)
            expect(JSON.stringify(state)).toBe(source)
          }
        } finally {
          renderer.dispose()
        }
      }
    }
  },
)
