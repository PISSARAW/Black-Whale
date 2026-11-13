import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { floorOf, type TierPlan } from './blueprint'
import {
  dressBriefingScreen,
  dressRoyalArmyConferenceArchitecture,
  dressTacticalChartBoard,
} from './royalArmyConferenceArchitecture'
import { dressRoyalArmyConferenceCeiling } from './royalArmyConferenceCeiling'
import {
  dressConferenceChair,
  dressConferencePlatform,
  dressConferenceTable,
  dressLectern,
} from './royalArmyConferenceFurniture'
import { dressRoyalArmyConferenceWallDetails } from './royalArmyConferenceWallDetails'
import type { Structure } from './types'

export const ROYAL_ARMY_CONFERENCE_ROOM = 'tier-4-royal-army-conference-room-floor'

/** Visual replacement only: original blueprint solids still supply collisions and evidence mode. */
export function royalArmyConferenceSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal) return plan
  return {
    ...plan,
    structures: plan.structures.filter((s) => s.spaceId !== ROYAL_ARMY_CONFERENCE_ROOM),
  }
}

function dressStructure(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  if (structure.kind === 'painting') {
    if (structure.id.endsWith('screen')) {
      dressBriefingScreen(into, structure, floor)
    } else {
      dressTacticalChartBoard(into, structure, floor)
    }
    return
  }
  if (structure.kind === 'platform') {
    dressConferencePlatform(into, structure, floor)
    return
  }
  if (structure.kind === 'counter') {
    dressLectern(into, structure, floor)
    return
  }
  if (structure.kind === 'table') {
    dressConferenceTable(into, structure, floor)
    return
  }
  if (structure.kind === 'seat') {
    dressConferenceChair(into, structure, floor)
  }
}

/** Chapter 380, reading pages 1–6; dimensions and unseen profiles remain reconstructed. */
export function buildRoyalArmyConferenceDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || spaceId !== ROYAL_ARMY_CONFERENCE_ROOM) return null

  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  if (!space) return null

  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)
  const structures = plan.structures.filter((structure) => structure.spaceId === spaceId)

  // Pale tiled floor and plain wall panels.
  dressRoyalArmyConferenceArchitecture({ THREE, into, plan, space })

  // Enclose the interpreted ceiling without unsupported technical equipment.
  dressRoyalArmyConferenceCeiling({ into, plan, space })

  // Lower wall grille visible beside the presentation area.
  dressRoyalArmyConferenceWallDetails({ into, plan, space })

  // Plain furnishings and blank presentation surfaces.
  for (const structure of structures) {
    dressStructure(into, structure, floor)
  }

  return into.finish('royal-army-conference-details')
}
