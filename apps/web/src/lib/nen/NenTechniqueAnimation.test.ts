import { describe, expect, it } from 'vitest'
import { NEN_ARCHIVE_ENTRIES } from './archive'
import { buildTechniqueAnimation, updateTechniqueAnimation } from './NenTechniqueAnimation'

describe('NenDex technique animations', () => {
  it('builds and animates a visible manifestation for every archive entry', () => {
    for (const entry of NEN_ARCHIVE_ENTRIES) {
      const rig = buildTechniqueAnimation(entry.kind, Number.parseInt(entry.color.slice(1), 16))
      let meshes = 0
      rig.traverse((part) => {
        if ('isMesh' in part && part.isMesh) meshes += 1
      })

      expect(meshes, entry.id).toBeGreaterThan(0)
      updateTechniqueAnimation(rig, 0.45, { time: 1_600, active: true })
      expect(rig.visible, entry.id).toBe(true)
      updateTechniqueAnimation(rig, 1, { time: 3_600, active: false })
      expect(rig.visible, entry.id).toBe(false)
    }
  })
})
