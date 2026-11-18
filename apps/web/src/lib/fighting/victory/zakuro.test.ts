import { expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from '../fighterFigure'
import { createFight } from '../engine'
import { fightBodyMotion } from '../fightBodyMotion'
import { defaultFightComfort } from '../fightComfort'
import { createVictoryRenderer } from './renderer'
import { selectVictory } from './catalogue'
import { createZakuroFilm } from '../../../../demos/fighting-showcase/zakuroFatalityFilm'

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
  'proves a finite-blood capture and native slam knockout on %s',
  (side) => {
    const film = createZakuroFilm({ side })
    expect(film.state.winner).toBe(side)
    expect(film.report.physicalKnockout).toBe(true)
    for (const key of [
      'equipped',
      'ownWound',
      'scouts',
      'harmlessScouts',
      'returned',
      'noHealing',
      'finalSlam',
    ] as const)
      expect(film.report[key], key).toBe(true)
    expect(film.report.enemyBloodControlled).toBe(false)
    expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
  },
)
it.each(['franklin', 'biscuit', 'zakuro'] as const)(
  'keeps Zakuro’s blood attached to real limbs and restores every native pose against %s',
  (target) => {
    const state = {
      ...createFight('zakuro', target),
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
        0, 54, 96, 132, 168, 210, 252, 282, 306, 324, 348, 372, 396, 420, 468, 486, 552, 570, 96,
        324,
      ]) {
        const restore = renderer.apply({
          state,
          models,
          comfort: defaultFightComfort(),
          frame: { ...selectVictory(state)!, active: true, elapsed: age / 60 },
        })!
        const audit = scene.userData.zakuroVictory
        expect(audit.impacts).toBe(Number(age >= 324) + Number(age >= 396))
        expect(audit.ownBloodOnly).toBe(true)
        expect(audit.enemyZetsu).toBe(false)
        expect(audit.enemyBloodControlled).toBe(false)
        expect(audit.scoutAttack).toBe(false)
        expect(audit.infusionEquipment).toBe(true)
        expect(audit.cinematicHealing).toBe(false)
        expect(Math.max(...audit.handErrors), `target ${target}, age ${age}`).toBeLessThan(0.06)
        if (age === 324) expect(audit.floor).toBeCloseTo(0.025, 3)
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
