import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import { hasTysonModel } from '$lib/tour/tysonView'

/** Use the same measured furniture footprints in the plan and the walked room. */
export const tysonApartmentFixtures = theShip()
  .structures.filter(hasTysonModel)
  .map((structure) => ({
    ...structure,
    polygon: structureFootprint(structure)
      .map(([x, z]) => `${((x + 10.5) * 700) / 21},${((z + 10.2) * 700) / 21}`)
      .join(' '),
  }))
