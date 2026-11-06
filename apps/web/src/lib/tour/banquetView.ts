import type * as Three from 'three'
import type { TierPlan } from './blueprint'
import { floorOf } from './blueprint'
import { BanquetDetailBuilder, disposeBanquetDetails } from './banquetDetailBuilder'
import { dressBanquetArchitecture } from './banquetArchitecture'
import { dressBanquetCurtain, dressBanquetTable, dressBanquetThrone } from './banquetFurniture'

export { disposeBanquetDetails }
export const BANQUET_SPACE = 'tier-1-banquet-hall'
export const BANQUET_SERVICE = `${BANQUET_SPACE}-service-end`

/**
 * Modelling of attested furnishings, not a second floor plan. Positions,
 * extents and levels come from the walked plan, so moved/removed tables never
 * leave their tablecloth behind. Chromatic finishes and small profiles are
 * interpretations of the monochrome art; see data/ship/banquet-hall-audit.md.
 */
export function buildBanquetDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || ![BANQUET_SPACE, BANQUET_SERVICE].includes(spaceId)) return null
  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  if (!space) return null
  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)
  const structures = plan.structures.filter((structure) => structure.spaceId === spaceId)
  for (const table of structures.filter((structure) => structure.kind === 'table')) {
    dressBanquetTable({ THREE, into, table, floor })
  }
  const dais = structures.find((structure) => structure.id === `${BANQUET_SPACE}-throne-dais`)
  if (dais) dressBanquetThrone(into, dais, floor)
  const curtain = structures.find((structure) => structure.id === `${BANQUET_SPACE}-curtain`)
  if (curtain) dressBanquetCurtain(into, curtain, floor)
  dressBanquetArchitecture({ THREE, into, plan, spaceId })
  return into.finish()
}
