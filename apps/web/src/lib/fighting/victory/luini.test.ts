import { expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from '../fighterFigure'
import { createFight } from '../engine'
import { fightBodyMotion } from '../fightBodyMotion'
import { defaultFightComfort } from '../fightComfort'
import { createVictoryRenderer } from './renderer'
import { selectVictory } from './catalogue'
import { createLuiniFilm } from '../../../../demos/fighting-showcase/luiniFatalityFilm'

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
  'proves a prepared round trip, lost anchor and physical knockout on %s',
  (side) => {
    const film = createLuiniFilm({ side })
    expect(film.state.winner).toBe(side)
    expect(film.report.physicalKnockout).toBe(true)
    for (const key of [
      'anchored',
      'visited',
      'departed',
      'returned',
      'harmless',
      'ownerOnly',
      'anchorLost',
    ] as const)
      expect(film.report[key], key).toBe(true)
    expect(film.report.victimTransported).toBe(false)
    expect(film.report.portalDamage).toBe(0)
    expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
  },
)
it.each(['franklin', 'biscuit', 'luini', 'hisoka'] as const)(
  'keeps Luini’s blade tip in real contact and restores every native pose against %s',
  (target) => {
    const state = {
      ...createFight('luini', target),
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
        0, 54, 84, 108, 120, 144, 186, 222, 234, 246, 282, 330, 342, 354, 378, 396, 408, 432, 468,
        486, 570, 84, 396,
      ]) {
        const restore = renderer.apply({
          state,
          models,
          comfort: defaultFightComfort(),
          frame: { ...selectVictory(state)!, active: true, elapsed: age / 60 },
        })!
        const audit = scene.userData.luiniVictory
        expect(audit.ownerOnly).toBe(true)
        expect(audit.victimTransported).toBe(false)
        expect(audit.portalDamage).toBe(0)
        expect(audit.bodyCount).toBe(1)
        expect(audit.singleDoor).toBe(true)
        expect(audit.anchorLost).toBe(age > 342)
        if (age >= 342) expect(audit.activePortals).toBe(0)
        expect(Math.max(...audit.handErrors), `target ${target}, age ${age}`).toBeLessThan(0.07)
        if (age === 396)
          expect(audit.tip.distanceTo(audit.target), `blade ${target}`).toBeLessThan(0.07)
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
