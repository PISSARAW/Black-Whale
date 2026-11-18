import { expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from '../fighterFigure'
import { createFight } from '../engine'
import { fightBodyMotion } from '../fightBodyMotion'
import { defaultFightComfort } from '../fightComfort'
import { createVictoryRenderer } from './renderer'
import { selectVictory } from './catalogue'
import { createBashoFilm } from '../../../../demos/fighting-showcase/bashoFatalityFilm'

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
  'proves a completed poem, real ignition and heat knockout on %s',
  (side) => {
    const film = createBashoFilm({ side })
    expect(film.state.winner).toBe(side)
    expect(film.report.burnKnockout).toBe(true)
    for (const key of [
      'written',
      'stationary',
      'harmlessWriting',
      'ignited',
      'aliveOnContact',
      'heatDeath',
      'recognizedPoem',
    ] as const)
      expect(film.report[key], key).toBe(true)
    expect(film.report.arbitrarySpell).toBe(false)
    expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
  },
)
it.each(['franklin', 'biscuit', 'basho', 'hisoka'] as const)(
  'keeps Basho’s paper held, pen aligned and fists in real contact and restores every native pose against %s',
  (target) => {
    const state = {
      ...createFight('basho', target),
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
        0, 30, 60, 90, 120, 144, 174, 198, 216, 240, 276, 300, 330, 360, 384, 408, 432, 468, 486,
        540, 570, 60, 384,
      ]) {
        const restore = renderer.apply({
          state,
          models,
          comfort: defaultFightComfort(),
          frame: { ...selectVictory(state)!, active: true, elapsed: age / 60 },
        })!
        const audit = scene.userData.bashoVictory
        expect(audit.recognizedPoem).toBe(true)
        expect(audit.arbitrarySpell).toBe(false)
        expect(audit.fireBeforeContact).toBe(false)
        expect(audit.ignitions).toBe([216, 300, 384].filter((at) => age >= at).length)
        if (age < 216) expect(audit.fireVisible).toBe(false)
        expect(Math.max(...audit.handErrors), `target ${target}, age ${age}`).toBeLessThan(0.07)
        if (age < 144) expect(audit.penError, `pen ${target} ${age}`).toBeLessThan(0.07)
        if ([216, 300, 384].includes(age))
          expect(audit.hand.distanceTo(audit.contact), `punch ${target} ${age}`).toBeLessThan(0.07)
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
