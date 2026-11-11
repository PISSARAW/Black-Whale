import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import { hasTubeppaModel } from '$lib/tour/tubeppaView'

/** Use the same measured furniture footprints in the plan and the walked room. */
export const tubeppaApartmentFixtures = theShip()
  .structures.filter(hasTubeppaModel)
  .map((structure) => ({
    ...structure,
    polygon: structureFootprint(structure)
      .map(([x, z]) => `${((x + 10.5) * 700) / 21},${((z + 10.2) * 700) / 21}`)
      .join(' '),
  }))
