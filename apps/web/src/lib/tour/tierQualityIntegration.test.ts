import { describe, expect, it } from 'vitest'
import * as THREE from 'three'

import { theShip } from './blueprint'
import { createDeckMaterials } from './deckMaterials'
import { fittingFlickerUniformsOf } from './fittingFlicker'
import { EMPTY_WORLD } from './hatsu'
import { qualityProfile, type QualityTier } from './quality'
import { conditionUniformsOf } from './surfaceCondition'
import { TierView } from './TierView'

function deckAt(tier: QualityTier) {
  const ship = theShip()
  const materials = createDeckMaterials(THREE, qualityProfile({ tier, coarse: false }))
  const view = new TierView(THREE, materials)
  const built = view.build({
    ship,
    world: EMPTY_WORLD,
    tierId: 'tier-5',
    reveal: false,
    dustScale: 0,
  })
  return { built, materials, view }
}

describe('deck condition quality integration', () => {
  it('allocates no condition, halo or flicker buffers on low', () => {
    const low = deckAt('low')
    expect(conditionUniformsOf(low.materials.surface)).toBeNull()
    expect(fittingFlickerUniformsOf(low.materials.fitting)).toBeNull()
    expect(low.built.rooms[0].mesh.geometry.getAttribute('aTraffic')).toBeUndefined()
    expect(low.built.rooms[0].fittings.geometry.getAttribute('aFlicker')).toBeUndefined()
    expect(low.built.lampAir).toBeNull()
    low.view.dispose(low.built)
  })

  it('builds all three room-state channels on high', () => {
    const high = deckAt('high')
    expect(conditionUniformsOf(high.materials.surface)).not.toBeNull()
    expect(fittingFlickerUniformsOf(high.materials.fitting)).not.toBeNull()
    expect(high.built.rooms[0].mesh.geometry.getAttribute('aTraffic').count).toBeGreaterThan(0)
    expect(high.built.rooms[0].fittings.geometry.getAttribute('aFlicker').count).toBeGreaterThan(0)
    expect(high.built.lampAir?.geometry.getAttribute('position').count).toBeGreaterThan(0)
    high.view.dispose(high.built)
  })
})
