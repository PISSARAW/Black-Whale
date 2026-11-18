import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure, fightFigureKey } from './fighterFigure'
import { createPreparationScene } from './preparationScene'
import { stitchingSetup, stitchingFrames, severedPart } from './machiReattachmentTestSetup'
import { performArsenalCommand } from './retrospectiveArsenal'

const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })
describe('the real shared forearm moves from the floor back to the injured articulated body', () => {
  it('keeps the elbow and hand together, then restores skin rather than Nen rubber', () => {
    const state = stitchingSetup()
    const initial = buildFightFigure({ THREE, glow, fighter: state.opponent })
    expect(initial.root.getObjectByName('elbow-left')!.visible).toBe(false)
    expect(initial.root.getObjectByName('elbow-right')!.visible).toBe(false)
    expect(initial.root.getObjectByName('knee-right')!.visible).toBe(true)
    const scene = new THREE.Scene()
    const prepared = createPreparationScene({
      THREE,
      scene,
      worldX: (x) => x * 0.12,
      worldY: (y) => y * 0.12,
    })
    prepared.sync(state, 0)
    const root = scene.getObjectByName(`prepared:${severedPart(state).id}`)!
    const forearm = root.getObjectByName('elbow-left')!
    expect(forearm.parent).toBe(root)
    expect(forearm.getObjectByName('hand-left')).toBeDefined()
    expect(forearm.visible).toBe(true)
    expect(root.children.filter((child) => child.visible)).toEqual([forearm])
    prepared.sync(state, 1)
    expect(scene.getObjectByName(root.name)).toBe(root)
    const completed = stitchingFrames(
      performArsenalCommand(state, 'player', {
        action: 'machi-reattach',
        target: severedPart(state).id,
      }),
      'player',
      92,
    )
    prepared.sync(completed, 2)
    expect(root.visible).toBe(false)
    const repaired = buildFightFigure({ THREE, glow, fighter: completed.opponent })
    expect(fightFigureKey(completed.opponent)).not.toBe(fightFigureKey(state.opponent))
    expect(repaired.root.getObjectByName('elbow-left')!.visible).toBe(true)
    expect(repaired.root.getObjectByName('elbow-right')!.visible).toBe(false)
    expect(repaired.root.getObjectByName('hand-left')!.userData.physicalMatter).not.toBe(
      'nen-rubber',
    )
    prepared.dispose()
  })
})
