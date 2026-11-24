import { expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from '../fighterFigure'
import { createFight } from '../engine'
import { fightBodyMotion } from '../fightBodyMotion'
import { defaultFightComfort } from '../fightComfort'
import { createVictoryRenderer } from './renderer'
import { selectVictory } from './catalogue'
import { sayirdTrack, SAYIRD_HITS } from './sayirdTrack'
import { createSayirdFilm } from '../../../../demos/fighting-showcase/sayirdFilm'

function snapshot(root: THREE.Object3D) {
  const all: unknown[] = []
  root.traverse((node) =>
    all.push([
      node.uuid,
      ...node.position.toArray(),
      ...node.quaternion.toArray(),
      ...node.scale.toArray(),
      node.visible,
    ]),
  )
  return JSON.stringify(all)
}

it.each(['franklin', 'kalluto', 'sayird'] as const)(
  'uses a real small host, six native hits and a native fall against %s',
  (target) => {
    const track = sayirdTrack(target)
    expect(track.impacts.map((hit) => hit.slot)).toEqual([
      'standingLight',
      'forwardLight',
      'standingHeavy',
      'lowLight',
      'forwardLight',
      'standingHeavy',
    ])
    for (const side of ['player', 'opponent'] as const) {
      const state = {
        ...createFight(
          side === 'player' ? 'sayird' : target,
          side === 'player' ? target : 'sayird',
        ),
        phase: 'finished' as const,
        winner: side,
      }
      const build = (fighter: typeof state.player) => {
        const model = buildFightFigure({
          THREE,
          glow: (color, opacity = 1) =>
            new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 }),
          fighter,
        })
        model.animate(0, 'idle', { motion: fightBodyMotion({ fighter, seconds: 0, progress: 0 }) })
        return model.root
      }
      const models = { player: build(state.player), opponent: build(state.opponent) }
      const scene = new THREE.Scene(),
        scenery = new THREE.Group(),
        camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.03, 50)
      scene.add(scenery, models.player, models.opponent)
      const before = snapshot(scene),
        source = JSON.stringify(state)
      const renderer = createVictoryRenderer({ scene, scenery, camera })
      try {
        for (const age of [
          0,
          24,
          66,
          120,
          150,
          180,
          204,
          228,
          ...SAYIRD_HITS,
          415,
          468,
          510,
          570,
        ]) {
          const restore = renderer.apply({
            state,
            models,
            comfort: defaultFightComfort(),
            frame: { ...selectVictory(state)!, elapsed: age / 60, active: true },
          })!
          const audit = scene.userData.sayirdVictory
          expect(audit).toBeDefined()
          expect(audit.hostExistsBeforeCapture).toBe(true)
          expect(audit.littleEyeDamage).toBe(0)
          expect(audit.humanManipulation).toBe(false)
          expect(audit.handError).toBeLessThan(0.065)
          if (age >= 66) expect(audit.captured).toBe(true)
          if (age >= 414) expect(audit.hits).toBe(6)
          if (age === 150) expect(audit.pov).toBe(true)
          if (age === 570) expect(audit.fall.floor).toBeCloseTo(0.012, 5)
          restore()
          expect(snapshot(scene)).toBe(before)
          expect(JSON.stringify(state)).toBe(source)
        }
        let fixedCamera: string | undefined
        for (const age of [0, 150, 310, 570]) {
          const restore = renderer.apply({
            state,
            models,
            comfort: { ...defaultFightComfort(), camera: 0 },
            frame: { ...selectVictory(state)!, elapsed: age / 60, active: true },
          })!
          const view = JSON.stringify([
            ...camera.position.toArray(),
            ...camera.quaternion.toArray(),
          ])
          fixedCamera ??= view
          expect(view).toBe(fixedCamera)
          expect(scene.userData.sayirdVictory.pov).toBe(false)
          restore()
        }
      } finally {
        renderer.dispose()
      }
    }
  },
)

it.each(['player', 'opponent'] as const)(
  'earns %s’s verdict with physical commands and no health reset',
  (side) => {
    const film = createSayirdFilm({ side })
    expect(film.state.winner).toBe(side)
    expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
    expect(film.report.abilityProof.nativeActivation).toBe(false)
    expect(film.report.impactFrames).toHaveLength(6)
  },
)
