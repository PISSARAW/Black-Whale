import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from './fighterFigure'
import { createFightState } from './fightState'
import { animateChrolloBook } from './chrolloFigure'
import { forceZetsu } from './nen'

describe('Bandit’s Secret on the fighting rig', () => {
  it.each([1, -1] as const)(
    'holds the open book in the right hand facing %s and stows the closed book',
    (facing) => {
      const fighter = { ...createFightState('chrollo', 'illumi').player, facing }
      const model = buildFightFigure({
        THREE,
        fighter,
        glow: (colour, opacity) =>
          new THREE.MeshBasicMaterial({ color: colour, opacity, transparent: opacity < 1 }),
      })
      const held = model.root.getObjectByName('chrollo-open-book')!
      const stowed = model.root.getObjectByName('chrollo-closed-book')!
      expect(held.parent?.name).toBe('hand-right')
      animateChrolloBook(model.turns, fighter)
      expect(held.visible).toBe(true)
      expect(stowed.visible).toBe(false)
      const closed = {
        ...fighter,
        chrolloBook: {
          ...fighter.chrolloBook!,
          open: false,
          bookmark: 'sun-and-moon' as const,
        },
      }
      animateChrolloBook(model.turns, closed)
      expect(held.visible).toBe(false)
      expect(stowed.visible).toBe(true)
      expect(stowed.getObjectByName('chrollo-bookmark')?.visible).toBe(true)
      animateChrolloBook(model.turns, forceZetsu(closed))
      expect(held.visible).toBe(false)
      expect(stowed.visible).toBe(false)
    },
  )
})
