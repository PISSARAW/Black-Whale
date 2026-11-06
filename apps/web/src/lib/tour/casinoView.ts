import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { CasinoFixture } from './casinoFixture'
import { dressCasinoArchitecture } from './casinoArchitecture'
import { CASINO_SPACE, hasCasinoModel } from './casinoLayout'
import { columnWalls } from './geometry'
import type { WallSegment } from './types'
import {
  dressCasinoMachine,
  dressCasinoSeat,
  dressSwampBall,
  dressCasinoLoungeTable,
} from './casinoMachines'

export function buildCasinoDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || spaceId !== CASINO_SPACE) return null
  const space = plan.spaces.find(({ id }) => id === spaceId)
  if (!space) return null
  const into = new BanquetDetailBuilder(THREE),
    floor = floorOf(space, plan.tier)
  dressCasinoArchitecture({ THREE, into, plan })
  for (const structure of plan.structures.filter(hasCasinoModel)) {
    const model = new CasinoFixture(THREE, into, { structure, floor })
    if (structure.id.endsWith('-swamp-ball')) dressSwampBall(THREE, model)
    else if (structure.id.includes('-gaming-table-')) dressCasinoMachine(THREE, model)
    else if (structure.kind === 'seat') dressCasinoSeat(model)
    else dressCasinoLoungeTable(model)
  }
  return into.finish('casino-manga-details')
}

/** Omit duplicate coarse visuals, retaining the complete walked collision plan. */
export function casinoSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || !plan.spaces.some(({ id }) => id === CASINO_SPACE)) return plan
  const key = (wall: WallSegment) => `${wall.start.join(',')}:${wall.end.join(',')}`
  const faces = new Set(
    (plan.columns.get(CASINO_SPACE) ?? []).flatMap((centre) =>
      columnWalls(CASINO_SPACE, centre).map(key),
    ),
  )
  const columns = new Map(plan.columns)
  columns.delete(CASINO_SPACE)
  return {
    ...plan,
    columns,
    walls: plan.walls.filter((wall) => wall.spaceId !== CASINO_SPACE || !faces.has(key(wall))),
    structures: plan.structures.filter((solid) => !hasCasinoModel(solid)),
  }
}
