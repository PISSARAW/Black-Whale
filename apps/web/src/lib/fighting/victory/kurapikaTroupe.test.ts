import { expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from '../fighterFigure'
import { createFight } from '../engine'
import { FIGHTING_ROSTER } from '../roster'
import { troupeMember } from '../troupeMembership'
import { fightBodyMotion } from '../fightBodyMotion'
import { defaultFightComfort } from '../fightComfort'
import { selectVictory } from './catalogue'
import { createVictoryRenderer } from './renderer'
import { TROUPE_PUNCHES } from './kurapikaTroupePunch'

const members = FIGHTING_ROSTER.filter((entry) => troupeMember(entry.id)).map((entry) => entry.id)
function snapshot(root: THREE.Object3D) {
  const nodes: unknown[] = []
  root.traverse((node) =>
    nodes.push([
      node.uuid,
      node.position.toArray().map((value) => (value === 0 ? 0 : value)),
      node.quaternion.toArray().map((value) => (value === 0 ? 0 : value)),
      node.scale.toArray().map((value) => (value === 0 ? 0 : value)),
      node.visible,
      node instanceof THREE.Mesh
        ? (Array.isArray(node.material) ? node.material : [node.material]).map(
            (material) => material.uuid,
          )
        : null,
    ]),
  )
  return nodes
}
it.each(members)(
  'adapts every real fist contact and the native fall to the Spider %s',
  (target) => {
    const fresh = createFight('kurapika', target)
    const state = { ...fresh, phase: 'finished' as const, winner: 'player' as const }
    const glow = (color: number, opacity = 1) =>
      new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
    const build = (fighter: typeof state.player) => {
      const model = buildFightFigure({ THREE, glow, fighter })
      model.animate(0, 'idle', { motion: fightBodyMotion({ fighter, seconds: 0, progress: 0 }) })
      return model.root
    }
    const models = { player: build(state.player), opponent: build(state.opponent) }
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.1, 50),
      scenery = new THREE.Group()
    scene.add(scenery, models.player, models.opponent)
    const before = snapshot(scene),
      source = JSON.stringify(state)
    const renderer = createVictoryRenderer({ scene, camera, scenery })
    try {
      for (const age of [0, 63, ...TROUPE_PUNCHES.map((punch) => punch.frame), 360, 420, 570]) {
        const restore = renderer.apply({
          state,
          models,
          comfort: defaultFightComfort(),
          frame: { ...selectVictory(state)!, elapsed: age / 60, active: true },
        })!
        const audit = scene.userData.kurapikaTroupeVictory
        if (TROUPE_PUNCHES.some((punch) => punch.frame === age))
          expect(audit.contactError, `${target} at ${age}`).toBeLessThan(0.04)
        if (age === 63) {
          expect(audit.jail).toBe(true)
          expect(audit.bound).toBe(1)
        }
        if (age >= 420) expect(audit.jail).toBe(false)
        if (age === 570) expect(audit.floor).toBeLessThan(0.05)
        restore()
        expect(snapshot(scene)).toEqual(before)
        expect(JSON.stringify(state)).toBe(source)
      }
    } finally {
      renderer.dispose()
    }
  },
)
it.each(['hisoka', 'biscuit', 'kurapika'] as const)(
  'keeps %s on the non-Troupe variant',
  (target) => {
    const state = {
      ...createFight('kurapika', target),
      phase: 'finished' as const,
      winner: 'player' as const,
    }
    expect(selectVictory(state)?.variant).toBe('kurapika-judgment')
  },
)
