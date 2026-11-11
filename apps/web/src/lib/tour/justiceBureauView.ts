import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { JusticeBureauSurface } from './justiceBureauDetailSurface'
import {
  dressOffice1010Architecture,
  dressLobbyArchitecture,
  dressHallArchitecture,
} from './justiceBureauArchitecture'
import { dressVisitationArchitecture } from './justiceBureauVisitation'
import {
  dressMagistrateDesk,
  dressVisitorChair,
  dressReceptionCounter,
  dressInterrogationTable,
} from './justiceBureauFurniture'
import type { Structure } from './types'

export const JUSTICE_DEPUTY_OFFICE = 'tier-2-ministry-of-justice-deputy-office'
export const JUSTICE_VISITATION = 'tier-2-ministry-of-justice-visitation'
export const JUSTICE_LOBBY = 'tier-2-ministry-of-justice-lobby'
export const JUSTICE_HALL = 'tier-2-ministry-of-justice-hall'

const JUSTICE_SPACES = new Set([
  JUSTICE_DEPUTY_OFFICE,
  JUSTICE_VISITATION,
  JUSTICE_LOBBY,
  JUSTICE_HALL,
])

export function isJusticeBureauSpace(spaceId: string): boolean {
  return JUSTICE_SPACES.has(spaceId)
}

export function hasJusticeBureauModel(structure: Structure): boolean {
  return (
    structure.id === 'tier-2-ministry-of-justice-deputy-desk' ||
    structure.id === 'tier-2-ministry-of-justice-bookcases' ||
    structure.id === 'tier-2-ministry-of-justice-deputy-side-bookcase' ||
    structure.id === 'tier-2-ministry-of-justice-deputy-visitor-chair-01' ||
    structure.id === 'tier-2-ministry-of-justice-deputy-visitor-chair-02' ||
    structure.id === 'tier-2-ministry-of-justice-lobby-desk' ||
    structure.spaceId === JUSTICE_VISITATION
  )
}

/** Omit coarse blueprint boxes from walked plan while retaining collision */
export function justiceSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || !plan.spaces.some(({ id }) => isJusticeBureauSpace(id))) return plan
  return {
    ...plan,
    structures: plan.structures.filter((structure) => !hasJusticeBureauModel(structure)),
  }
}

function dressSpaceStructures(into: BanquetDetailBuilder, plan: TierPlan, spaceId: string): void {
  const space = plan.spaces.find((s) => s.id === spaceId)
  if (!space) return
  const floor = floorOf(space, plan.tier)
  const structures = plan.structures.filter((s) => s.spaceId === spaceId)

  for (const structure of structures) {
    const surface = new JusticeBureauSurface(into, structure, floor)
    if (structure.id.endsWith('-deputy-desk')) dressMagistrateDesk(surface)
    else if (structure.id.includes('-deputy-visitor-chair')) dressVisitorChair(surface)
    else if (structure.id.endsWith('-lobby-desk')) dressReceptionCounter(surface)
    else if (structure.id.includes('-interrogation-table')) dressInterrogationTable(surface)
  }
}

/** Reconstructed Justice Bureau from Chapter 400 (room 1010, visitation, lobby) */
export function buildJusticeBureauDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || !isJusticeBureauSpace(spaceId)) return null

  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  if (!space) return null

  const into = new BanquetDetailBuilder(THREE)
  const archOptions = { THREE, into, plan, space }

  if (spaceId === JUSTICE_DEPUTY_OFFICE) {
    dressOffice1010Architecture(archOptions)
    dressSpaceStructures(into, plan, spaceId)
    return into.finish('justice-office-1010-manga-details')
  }
  if (spaceId === JUSTICE_VISITATION) {
    dressVisitationArchitecture(archOptions)
    dressSpaceStructures(into, plan, spaceId)
    return into.finish('justice-visitation-manga-details')
  }
  if (spaceId === JUSTICE_LOBBY) {
    dressLobbyArchitecture(archOptions)
    dressSpaceStructures(into, plan, spaceId)
    return into.finish('justice-lobby-manga-details')
  }
  if (spaceId === JUSTICE_HALL) {
    dressHallArchitecture(archOptions)
    return into.finish('justice-hall-manga-details')
  }

  return null
}
