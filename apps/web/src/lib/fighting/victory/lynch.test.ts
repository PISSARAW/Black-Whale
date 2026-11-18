import { expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from '../fighterFigure'
import { createFight } from '../engine'
import { fightBodyMotion } from '../fightBodyMotion'
import { defaultFightComfort } from '../fightComfort'
import { createVictoryRenderer } from './renderer'
import { selectVictory } from './catalogue'
import { createLynchFilm } from '../../../../demos/fighting-showcase/lynchFatalityFilm'

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
  'proves a conscious Body and Soul replies and physical knockout on %s',
  (side) => {
    const film = createLynchFilm({ side })
    expect(film.state.winner).toBe(side)
    expect(film.report.physicalKnockout).toBe(true)
    expect(film.report.answers).toBe(6)
    for (const key of [
      'truthfulIdentity',
      'consciousAnswers',
      'privateAnswers',
      'noReplyAfterKo',
    ] as const)
      expect(film.report[key], key).toBe(true)
    expect(film.report.soulDamage).toBe(false)
    expect(film.report.futureReading).toBe(false)
    expect(film.report.continuity).toEqual({ resets: 0, backwards: false, healed: false })
  },
)
it.each(['franklin', 'biscuit', 'lynch', 'hisoka'] as const)(
  'keeps Lynch’s fists in real contact and restores every native pose against %s',
  (target) => {
    const state = {
      ...createFight('lynch', target),
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
        0, 48, 96, 126, 132, 144, 180, 234, 246, 270, 318, 330, 342, 354, 378, 396, 397, 420, 456,
        486, 570, 132, 396,
      ]) {
        const restore = renderer.apply({
          state,
          models,
          comfort: defaultFightComfort(),
          frame: { ...selectVictory(state)!, active: true, elapsed: age / 60 },
        })!
        const audit = scene.userData.lynchVictory
        expect(audit.impacts).toBe(
          [132, 246, 318, 330, 342, 354, 396].filter((at) => age >= at).length,
        )
        expect(audit.noSoulDamage).toBe(true)
        expect(audit.soulExtracted).toBe(false)
        expect(audit.afterKoReply).toBe(false)
        expect(audit.publicNameOnly).toBe(true)
        expect(Math.max(...audit.handErrors), `target ${target}, age ${age}`).toBeLessThan(0.06)
        if ([132, 246, 318, 330, 342, 354, 396].includes(age))
          expect(audit.hand.distanceTo(audit.contact), `contact ${target} ${age}`).toBeLessThan(
            0.06,
          )
        if (age >= 396) expect(audit.answerVisible).toBe(false)
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
