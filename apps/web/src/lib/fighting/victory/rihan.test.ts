import { expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from '../fighterFigure'
import { createFight } from '../engine'
import { fightBodyMotion } from '../fightBodyMotion'
import { defaultFightComfort } from '../fightComfort'
import { createVictoryRenderer } from './renderer'
import { selectVictory } from './catalogue'
import { createRihanFilm } from '../../../../demos/fighting-showcase/rihanFatalityFilm'

it('earns the same targeted Rihan predation against Bungee Gum', () => {
  const film = createRihanFilm({ target: 'hisoka' })
  expect(film.report.proof).toMatchObject({ prey: 'bungee-gum', sealed: true, harmless: true })
  expect(film.report.physicalBullet).toBe(true)
})
it('keeps Rihan physical when no supported construct can be studied', () => {
  const film = createRihanFilm({ target: 'biscuit' })
  expect(film.report.proof).toBeNull()
  expect(film.state.winner).toBe('player')
})

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
  'proves a targeted predation and physical-pistol knockout on %s',
  (side) => {
    const film = createRihanFilm({ side })
    expect(film.state.winner).toBe(side)
    expect(film.report.physicalBullet).toBe(true)
    expect(film.report.predationDamage).toBe(0)
    expect(film.report.proof).toMatchObject({ sealed: true, harmless: true, enemyNotSealed: true })
    expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
  },
)
it.each(['shizuku', 'hisoka', 'franklin', 'biscuit', 'rihan'] as const)(
  'keeps Rihan’s predation, contacts and physical fall coherent against %s',
  (target) => {
    const state = {
      ...createFight('rihan', target),
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
      for (const age of [0, 90, 144, 240, 282, 312, 342, 366, 384, 408, 480, 570, 90, 312]) {
        const restore = renderer.apply({
          state,
          models,
          comfort: defaultFightComfort(),
          frame: { ...selectVictory(state)!, active: true, elapsed: age / 60 },
        })!
        const audit = scene.userData.rihanVictory
        expect(audit.predationDamage).toBe(0)
        expect(audit.enemyZetsu).toBe(false)
        expect(audit.shots).toBe(Number(age >= 384))
        expect(audit.ownSealHours).toBe(audit.prey && age >= 342 ? 48 : 0)
        expect(Math.max(...audit.handErrors), `target ${target}, age ${age}`).toBeLessThan(0.06)
        expect(audit.gripError, `prey grip ${target}, age ${age}`).toBeLessThan(0.06)
        if (age === 384)
          expect(
            audit.target.clone().sub(audit.muzzle).normalize().dot(audit.barrelDirection),
          ).toBeGreaterThan(0.99)
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
