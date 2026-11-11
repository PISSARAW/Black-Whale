import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import { hasTserriednichModel } from '$lib/tour/tserriednichRoomView'

/** Shared apartment metric projection; no second hard-coded furniture arrangement. */
export const tserriednichApartmentFixtures = theShip()
  .structures.filter(hasTserriednichModel)
  .map((structure) => ({
    ...structure,
    polygon: structureFootprint(structure)
      .map(([x, z]) => `${((x + 10.5) * 700) / 21},${((z + 10.2) * 700) / 21}`)
      .join(' '),
  }))
