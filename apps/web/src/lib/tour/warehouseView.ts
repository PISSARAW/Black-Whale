import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { WarehouseDetailSurface } from './warehouseDetailSurface'
import { dressWarehouseArchitecture } from './warehouseArchitecture'
import { dressWarehouseFloor } from './warehouseFloor'
import { dressWarehouseCrate } from './warehouseCrates'
import { dressWarehouseGuardPost } from './warehouseGuardPost'
import { dressEntranceCamera, dressWarehouseEntranceFeatures } from './warehouseEntrance'
import type { Structure } from './types'

export const WAREHOUSE_SPACE = 'tier-5-warehouse'

export function isWarehouseSpace(spaceId: string): boolean {
  return spaceId === WAREHOUSE_SPACE
}

export function hasWarehouseModel(structure: Structure): boolean {
  return structure.spaceId === WAREHOUSE_SPACE || structure.id.startsWith('tier-5-warehouse-')
}

/** Omit coarse blueprint boxes from walked plan while retaining collision physics */
export function warehouseSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || !plan.spaces.some(({ id }) => id === WAREHOUSE_SPACE)) return plan
  return {
    ...plan,
    structures: plan.structures.filter((structure) => !hasWarehouseModel(structure)),
  }
}

function dressStructure(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const surface = new WarehouseDetailSurface(into, structure, floor)
  const id = structure.id

  if (id === 'tier-5-warehouse-camera') {
    dressEntranceCamera(surface)
  } else if (id.startsWith('tier-5-warehouse-guard-post-')) {
    const postIndex = Number(id.replace('tier-5-warehouse-guard-post-', '')) - 1
    dressWarehouseGuardPost(surface, Math.max(0, postIndex))
  } else if (id.startsWith('tier-5-warehouse-crate-')) {
    const crateIndex = Number(id.replace('tier-5-warehouse-crate-', '')) - 1
    dressWarehouseCrate(surface, Math.max(0, crateIndex))
  }
}

export interface WarehouseViewOptions {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}

/** Chapter 378: high-fidelity Tier 5 warehouse guarded by the Cha-R family. */
export function buildWarehouseDetails(options: WarehouseViewOptions): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || spaceId !== WAREHOUSE_SPACE) return null

  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  if (!space) return null

  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)

  // 1. Tall archive hall, shallow roof trusses, pendant lamps and wall conduits
  dressWarehouseArchitecture({ THREE, into, floor })

  // 2. Concrete slab expansion joints, diamond steel plates, and hazard markings
  dressWarehouseFloor({ into, floor })

  // 3. Rolling freight shutter, locked service door, and Luini's spatial portal
  dressWarehouseEntranceFeatures({ into, floor })

  // 4. Dress the 37 blueprint structures (32 tall carton racks, 4 guard posts, 1 camera)
  const structures = plan.structures.filter((s) => s.spaceId === spaceId)
  for (const structure of structures) {
    dressStructure(into, structure, floor)
  }

  return into.finish('warehouse-cha-r-details')
}
