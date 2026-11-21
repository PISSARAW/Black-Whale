import { fightStage } from './stages'
import type { FightSide, FightState } from './types'

export interface FightStageTransition {
  fromSpaceId: string
  toSpaceId: string
  toNameFr: string
  toNameEn: string
  direction: 'left' | 'right'
  frame: number
  sequence: number
}

interface AdjacentRoom {
  spaceId: string
  nameFr: string
  nameEn: string
}

const room = (spaceId: string, nameFr: string, nameEn: string): AdjacentRoom => ({
  spaceId,
  nameFr,
  nameEn,
})

/** A real blueprint neighbour whose geometry can host Clash's shared fight lane. */
const ADJACENT_ROOMS: Partial<Record<string, AdjacentRoom>> = {
  'banquet-hall': room(
    'tier-1-royal-approach',
    'Vestibule de la salle de banquet',
    'Banquet Hall Vestibule',
  ),
  'vip-casino': room('tier-1-c-aft-passage', 'Traverse arrière', 'Aft Passage'),
  'observation-deck': room('tier-3-port-promenade', 'Promenade bâbord', 'Port Promenade'),
  'screening-room': room('tier-2-main-corridor', 'Couloir principal', 'Main Corridor'),
  'supreme-court': room('tier-1-b-starboard-corridor', 'Coursive tribord', 'Starboard Corridor'),
  'princes-burial-chamber': room(
    'tier-1-burial-passage',
    'Passage de la chambre funéraire',
    'Burial Chamber Passage',
  ),
  'heilly-hideout': room(
    'tier-2-heilly-secret-hideout',
    'Planque secrète Heil-Ly',
    'Heil-Ly Secret Hideout',
  ),
  'unma-salon': room(
    'tier-1-queens-corridor-port',
    'Couloir des reines — bâbord',
    'Queens’ Port Corridor',
  ),
  'cha-r-warehouse': room(
    'tier-5-transverse-corridor',
    'Couloir transversal',
    'Transverse Corridor',
  ),
  'central-dining-hall': room(
    'tier-5-service-corridor-forward',
    'Couloir de service (avant)',
    'Service Corridor (forward)',
  ),
  'cineplex-concourse': room('tier-3-cineplex-concession', 'Confiserie', 'Food & Drinks'),
  'cineplex-screen-corridor': room(
    'tier-3-cineplex-entrance-concourse',
    'Avant-hall du cinéma',
    'Entrance Concourse',
  ),
  'hangar-entrance': room(
    'tier-5-transverse-corridor',
    'Couloir transversal',
    'Transverse Corridor',
  ),
  'hull-suspension': room(
    'tier-5-hull-suspension-gangway',
    'Passerelle de suspension',
    'Suspension Gangway',
  ),
  'starboard-lifeboats': room('tier-1-route-b-landing', 'Palier de la route B', 'Route B Landing'),
}

export function adjacentStageRoom(state: FightState): AdjacentRoom | null {
  const stage = fightStage(state.environment.stageId)
  const initial = ADJACENT_ROOMS[stage.id]
  if (!stage.spaceId || !initial) return null
  const current = state.stageTransition?.toSpaceId ?? stage.spaceId
  if (current === initial.spaceId)
    return { spaceId: stage.spaceId, nameFr: stage.nameFr, nameEn: stage.nameEn }
  return current === stage.spaceId ? initial : null
}

const OTHER_SIDE: Record<FightSide, FightSide> = { player: 'opponent', opponent: 'player' }

function isWallBreakingKo(state: FightState, loser: FightSide): boolean {
  const impact = state.impact
  if (state.finishReason !== 'knockout' || !impact) return false
  return (
    state[loser].health <= 0 &&
    impact.attacker === OTHER_SIDE[loser] &&
    impact.wallSplat &&
    ![impact.blocked, impact.avoided, impact.invulnerable].some(Boolean)
  )
}

const BREACH_POSITION = {
  left: { loser: 38, winner: 54 },
  right: { loser: 62, winner: 46 },
} as const

export function applyKnockoutStageTransition(state: FightState, loser: FightSide): FightState {
  if (!isWallBreakingKo(state, loser)) return state
  const nextRoom = adjacentStageRoom(state)
  const stage = fightStage(state.environment.stageId)
  if (!nextRoom || !stage.spaceId) return state
  const direction = state[loser].x < 50 ? 'left' : 'right'
  const winner = OTHER_SIDE[loser]
  const position = BREACH_POSITION[direction]
  return {
    ...state,
    stageTransition: {
      fromSpaceId: state.stageTransition?.toSpaceId ?? stage.spaceId,
      toSpaceId: nextRoom.spaceId,
      toNameFr: nextRoom.nameFr,
      toNameEn: nextRoom.nameEn,
      direction,
      frame: state.frame,
      sequence: (state.stageTransition?.sequence ?? 0) + 1,
    },
    [loser]: { ...state[loser], x: position.loser },
    [winner]: { ...state[winner], x: position.winner },
  }
}
