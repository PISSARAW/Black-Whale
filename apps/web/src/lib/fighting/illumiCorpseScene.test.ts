import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createPreparationScene } from './preparationScene'
import { bookCorpseSetup, corpseEntry } from './illumiCorpseTestSetup'
import { needleCommand } from './illumiNeedleFaceTestSetup'
import { mapFrames } from './dowsingMapTestSetup'
import { expireHistoricalMatter } from './historicalMatterClock'

describe('physical corpse needles stay on the actual shared head', () => {
  it('keeps one articulated body, leaves metal visible after Nen ends, then removes that same assembly', () => {
    const scene = new THREE.Scene()
    const effect = createPreparationScene({
      THREE,
      scene,
      worldX: (x) => x * 0.12,
      worldY: (y) => y * 0.12,
    })
    const state = mapFrames(
      needleCommand(bookCorpseSetup(), { action: 'illumi-corpse', target: 'player:corpse' }),
      60,
    )
    effect.sync(state, 0)
    const root = scene.getObjectByName('prepared:player:corpse')!
    const pins = root.getObjectByName('corpse-control-needles')!
    expect(pins.parent).toBe(root.getObjectByName('face-mouth')!.parent)
    expect(pins.visible).toBe(true)
    const headX = pins.parent!.getWorldPosition(new THREE.Vector3()).x
    const stopped = expireHistoricalMatter({
      ...state,
      player: { ...state.player, chrolloBook: { ...state.player.chrolloBook!, open: false } },
    })
    expect(corpseEntry(stopped).controller).toBeUndefined()
    effect.sync(stopped, 1)
    expect(scene.getObjectByName(root.name)).toBe(root)
    expect(root.rotation.z).toBeCloseTo(Math.PI / 2)
    expect(pins.parent!.getWorldPosition(new THREE.Vector3()).x).toBeCloseTo(headX)
    expect(pins.visible).toBe(true)
    const removed = needleCommand(stopped, {
      action: 'illumi-corpse-release',
      target: 'player:corpse',
    })
    effect.sync(removed, 2)
    expect(scene.getObjectByName(root.name)).toBe(root)
    expect(pins.visible).toBe(false)
    effect.dispose()
  })
})
