import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import { hasZhangLeiModel } from '$lib/tour/zhangLeiView'

/** Shared apartment metric projection; each solid is drawn from its current walked footprint. */
export const zhangLeiApartmentFixtures = theShip()
  .structures.filter(hasZhangLeiModel)
  .map((structure) => ({
    ...structure,
    polygon: structureFootprint(structure)
      .map(([x, z]) => `${((x + 10.5) * 700) / 21},${((z + 10.2) * 700) / 21}`)
      .join(' '),
  }))
