import { expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from '../fighterFigure'
import { createFight } from '../engine'
import { fightBodyMotion } from '../fightBodyMotion'
import { defaultFightComfort } from '../fightComfort'
import { createVictoryRenderer } from './renderer'
import { selectVictory } from './catalogue'
import { createMizaistomFilm } from '../../../../demos/fighting-showcase/mizaistomFatalityFilm'

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
it.each(['player', 'opponent'] as const)(
  'proves a conditional restraint and physical knockout on %s',
  (side) => {
    const film = createMizaistomFilm({ side })
    expect(film.state.winner).toBe(side)
    expect(film.report.physicalKnockout).toBe(true)
    expect(film.report.proofs).toHaveLength(2)
    expect(film.report.redCardExecution).toBe(false)
    expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
  },
)
it.each(['franklin', 'biscuit', 'mizaistom'] as const)(
  'keeps Mizaistom’s restraint, contacts and fall physical against %s',
  (target) => {
    const state = {
      ...createFight('mizaistom', target),
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
    const frozenPoses = new Map<number, string>()
    try {
      for (const age of [
        0, 42, 144, 180, 216, 234, 236, 258, 300, 336, 378, 390, 392, 414, 480, 570, 42, 300,
      ]) {
        const restore = renderer.apply({
          state,
          models,
          comfort: defaultFightComfort(),
          frame: { ...selectVictory(state)!, active: true, elapsed: age / 60 },
        })!
        const audit = scene.userData.mizaistomVictory
        expect(audit.restraintDamage).toBe(0)
        expect(audit.redCardExecution).toBe(false)
        expect(audit.hits).toBe(Number(age >= 236) + Number(age >= 392))
        expect(Math.max(...audit.handErrors), `target ${target}, age ${age}`).toBeLessThan(0.06)
        if (audit.confined) {
          expect(audit.hits).toBe(age < 234 ? 0 : 1)
          const frozen = models.opponent
          frozen.updateWorldMatrix(true, true)
          const pose = JSON.stringify(
            ['hand-right', 'hand-left', 'torso', 'knee-left', 'knee-right'].map((name) =>
              frozen.getObjectByName(name)!.matrixWorld.elements.map((n) => Math.round(n * 1e6)),
            ),
          )
          const key = audit.confinementStart
          if (frozenPoses.has(key)) expect(pose).toBe(frozenPoses.get(key))
          else frozenPoses.set(key, pose)
        }
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
