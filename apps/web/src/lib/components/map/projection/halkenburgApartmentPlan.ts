import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import { hasHalkenburgModel } from '$lib/tour/halkenburgView'

/** Use the same measured furniture footprints in the plan and the walked room. */
export const halkenburgApartmentFixtures = theShip()
  .structures.filter(hasHalkenburgModel)
  .map((structure) => ({
    ...structure,
    polygon: structureFootprint(structure)
      .map(([x, z]) => `${((x + 10.5) * 700) / 21},${((z + 10.2) * 700) / 21}`)
      .join(' '),
  }))
