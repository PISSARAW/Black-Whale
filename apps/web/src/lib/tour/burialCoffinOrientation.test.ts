import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { BanquetDetailBuilder, disposeBanquetDetails } from './banquetDetailBuilder'
import { dressBurialCoffin } from './burialChamberFurniture'
import { theShip } from './blueprint'

const coffins = theShip().structures.filter((s) => s.id.includes('burial-chamber-rotunda-coffin'))

describe('burial coffin lids', () => {
  it.each(coffins)('$id follows the coffin axis instead of the world z axis', (source) => {
    const into = new BanquetDetailBuilder(THREE)
    dressBurialCoffin({ into, structure: { ...source, at: [0, 0] }, floor: 0 })
    const root = into.finish()
    root.rotation.y = -(source.rotation * Math.PI) / 180
    const bounds = new THREE.Box3().setFromObject(root, true)
    try {
      // The 2.2 m lid stays along the pod; the offset open lid may widen its side.
      expect(bounds.max.x - bounds.min.x).toBeLessThan(1.6)
      expect(bounds.max.z - bounds.min.z).toBeLessThan(2.4)
    } finally {
      disposeBanquetDetails(root)
    }
  })
})
