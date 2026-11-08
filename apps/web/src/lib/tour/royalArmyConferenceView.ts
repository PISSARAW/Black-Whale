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
  dressConferenceTable,
  dressLectern,
} from './royalArmyConferenceFurniture'
import { dressRoyalArmyConferenceWallDetails } from './royalArmyConferenceWallDetails'
import type { Structure } from './types'

export const ROYAL_ARMY_CONFERENCE_ROOM = 'tier-4-royal-army-conference-room-floor'

function dressStructure(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  if (structure.kind === 'painting') {
    if (structure.id.endsWith('screen')) {
      dressBriefingScreen(into, structure, floor)
    } else {
      dressTacticalChartBoard(into, structure, floor)
    }
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

/** Reconstructed Royal Army Conference & Briefing Room from Chapters 350 and 380 with full architectural fidelity. */
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

  // Architectural flooring, wainscoting, and presenter dais
  dressRoyalArmyConferenceArchitecture({ THREE, into, plan, space })

  // Suspended modular ceiling, troffers, projector, HVAC, security dome cameras, emergency signs
  dressRoyalArmyConferenceCeiling({ into, plan, space })

  // Coat of arms, armored double entrance doors, synchronized clocks, AV rack, auxiliary monitors
  dressRoyalArmyConferenceWallDetails({ into, plan, space })

  // Furniture and tactical projection displays
  for (const structure of structures) {
    dressStructure(into, structure, floor)
  }

  return into.finish('royal-army-conference-details')
}
