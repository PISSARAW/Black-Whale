import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight } from './engine'
import { createFutureBeastScene } from './futureBeastScene'
import { fightWorldX, fightWorldY } from './fightCoordinates'
import type { FightSide } from './types'

describe('Laplace companion in the real arena', () => {
  it.each(['player', 'opponent'] as const)(
    'follows its %s owner and stays out of the opponent’s private view',
    (owner) => {
      const scene = new THREE.Scene()
      let viewer: FightSide = owner
      const effects = createFutureBeastScene({
        THREE,
        scene,
        worldX: fightWorldX,
        worldY: fightWorldY,
        viewer: () => viewer,
      })
      const state = beginFight(
        createFight(
          owner === 'player' ? 'tserriednich' : 'feitan',
          owner === 'opponent' ? 'tserriednich' : 'feitan',
          { mode: 'versus-ai' },
        ),
      )
      state.parallelFuture = {
        owner,
        phase: 'diverging',
        cursor: 1,
        previewCursor: 0,
        preparation: 30,
        controls: null,
        frames: [],
      }
      const before = JSON.stringify(state)
      effects.sync(state, 0)
      const beast = scene.getObjectByName(`tserriednich-personal-beast:${owner}`)!
      expect(beast.visible).toBe(true)
      expect(beast.position.x).toBeCloseTo(fightWorldX(state[owner].x) - state[owner].facing)
      viewer = owner === 'player' ? 'opponent' : 'player'
      effects.sync(state, 1)
      expect(beast.visible).toBe(false)
      expect(JSON.stringify(state)).toBe(before)
      effects.sync({ ...state, mode: 'versus-local' }, 1)
      expect(beast.visible).toBe(true)
      effects.sync({ ...state, parallelFuture: undefined }, 2)
      expect(beast.visible).toBe(false)
      effects.dispose()
      expect(scene.children).toHaveLength(0)
    },
  )
})
