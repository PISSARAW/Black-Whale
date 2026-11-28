import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { frameAt } from './replay'
import { createSilentMajorityReplay } from './silentMajorityReplayScene'

describe('Silent Majority reconstruction', () => {
  it('shows the masked doll during the diversion and four materialized snakes during the attack', () => {
    const replay = createSilentMajorityReplay(THREE)
    const doll = replay.scene.getObjectByName('replay-marionette')!
    const victim = replay.scene.getObjectByName('replay-barrigen')!
    const snakes = replay.scene.children.filter((node) =>
      node.name.startsWith('replay-tsuchibokko-'),
    )
    const draw = (second: number) => replay.update(frameAt(second), second, 2)
    const visibleSnakes = () => snakes.filter((node) => node.visible)
    try {
      draw(1)
      expect(doll.visible).toBe(true)
      expect(doll.getObjectByName('silent-mask')).toBeTruthy()
      expect(doll.getObjectByName('silent-cross-left')).toBeTruthy()
      expect(doll.getObjectByName('silent-cross-right')).toBeTruthy()
      expect(doll.getObjectByName('face-mouth')).toBeUndefined()
      expect(doll.getObjectByName('silent-nape-zipper')).toBeTruthy()
      expect(doll.getObjectByName('silent-back-crest-left')).toBeTruthy()
      expect(doll.getObjectByName('silent-back-crest-right')).toBeTruthy()
      expect(doll.getObjectByName('silent-obi-bow')).toBeTruthy()
      const teeth = doll.getObjectByName('silent-zipper-teeth') as THREE.Mesh<
        THREE.BufferGeometry,
        THREE.MeshBasicMaterial
      >
      expect(teeth.material.color.getHex()).toBe(0xae8453)
      expect(victim.visible).toBe(false)
      expect(visibleSnakes()).toHaveLength(0)

      draw(2)
      expect(doll.visible).toBe(false)
      expect(victim.visible).toBe(true)
      expect(victim.getObjectByName('manga-head:barrigen')).toBeTruthy()
      expect(visibleSnakes()).toHaveLength(4)
      const parts = snakes[0].children.flatMap((node) => node.userData.parts ?? [node.name])
      expect(parts.filter((name) => /^tsuchibokko-mouth-/.test(name))).toHaveLength(5)

      draw(11)
      expect(victim.visible).toBe(true)
      expect(visibleSnakes()).toHaveLength(0)
      draw(0)
      expect(doll.visible).toBe(true)
      expect(victim.visible).toBe(false)
    } finally {
      replay.dispose()
    }
  })
})
