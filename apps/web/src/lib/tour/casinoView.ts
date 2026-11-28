import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { CasinoFixture } from './casinoFixture'
import { dressCasinoArchitecture } from './casinoArchitecture'
import { buildCasinoEmergencyDetails } from './casinoEmergencyView'
import { CASINO_SPACE, hasCasinoModel } from './casinoLayout'
import { casinoSpiralOpening } from './casinoSpiralLayout'
import { columnWalls, wallSegments } from './geometry'
import type { WallSegment } from './types'
import {
  dressCasinoMachine,
  dressCasinoIsland,
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
  if (reveal) return null
  const space = plan.spaces.find(({ id }) => id === spaceId)
  if (!space) return null
  if (spaceId !== CASINO_SPACE) return buildCasinoEmergencyDetails(THREE, plan, space)
  const into = new BanquetDetailBuilder(THREE),
    floor = floorOf(space, plan.tier)
  dressCasinoArchitecture({ THREE, into, plan })
  for (const structure of plan.structures.filter(
    (s) => s.spaceId === spaceId && hasCasinoModel(s),
  )) {
    const model = new CasinoFixture(THREE, into, { structure, floor })
    if (structure.id.endsWith('-swamp-ball')) dressSwampBall(THREE, model)
    else if (structure.id.includes('-machine-island-')) dressCasinoIsland(THREE, model)
    else if (structure.id.includes('-gaming-table-')) dressCasinoMachine(THREE, model)
    else if (structure.kind === 'seat') dressCasinoSeat(model)
    else dressCasinoLoungeTable(model)
  }
  return into.finish('casino-manga-details')
}

const wallKey = (wall: WallSegment) =>
  `${wall.spaceId}:${wall.start.join(',')}:${wall.end.join(',')}`

function openShaft(plan: TierPlan): TierPlan {
  for (const space of plan.spaces) {
    const aperture = casinoSpiralOpening(space)
    if (!aperture.length) continue
    const closed = new Set(wallSegments(space, plan.doorways).map(wallKey))
    return {
      ...plan,
      walls: [
        ...plan.walls.filter((wall) => !closed.has(wallKey(wall))),
        ...wallSegments(space, [...plan.doorways, ...aperture]),
      ],
    }
  }
  return plan
}

/** Omit duplicate coarse visuals, retaining the complete walked collision plan. */
export function casinoSurfacePlan(walked: TierPlan, reveal: boolean): TierPlan {
  const plan = openShaft(walked)
  if (reveal || !plan.spaces.some(({ id }) => id === CASINO_SPACE)) return plan
  const faces = new Set(
    (plan.columns.get(CASINO_SPACE) ?? []).flatMap((centre) =>
      columnWalls(CASINO_SPACE, centre).map(wallKey),
    ),
  )
  const columns = new Map(plan.columns)
  columns.delete(CASINO_SPACE)
  return {
    ...plan,
    columns,
    walls: plan.walls.filter((wall) => wall.spaceId !== CASINO_SPACE || !faces.has(wallKey(wall))),
    structures: plan.structures.filter((solid) => !hasCasinoModel(solid)),
  }
}
