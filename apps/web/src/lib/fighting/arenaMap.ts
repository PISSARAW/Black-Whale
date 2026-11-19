import { actualDocuments, touchesDocument } from './paperDocuments'
import { canReadDocument } from './paperDocumentReading'
import { paperTextureLive } from './paperTexture'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

export interface ArenaMap {
  left: number
  right: number
  bottom: number
  top: number
}
declare module './paperDocumentTypes' {
  interface PaperDocument {
    arenaMap?: ArenaMap
  }
}

/** An actual printed cross-section of this arena, not a live tracker or a supplied Hatsu. */
export function scenarioArenaMap(side: FightSide): PreparedEntity {
  return {
    id: `${side}:arena-map`,
    kind: 'paper',
    owner: side,
    x: side === 'player' ? 26 : 74,
    y: 0,
    present: true,
    material: 'real',
    health: 2,
    document: {
      text: 'Plan de l’arène · portes gauche et droite · sol et espace aérien',
      arenaMap: { left: 7, right: 93, bottom: 0, top: 24 },
    },
  }
}

export function visibleArenaMap(state: FightState, entry: PreparedEntity): ArenaMap | undefined {
  const paper = entry.document
  if (!paper?.arenaMap) return undefined
  if (paper.textures?.some((layer) => paperTextureLive(state, entry, layer))) return undefined
  return paper.arenaMap
}

export function accessibleArenaMap(state: FightState, side: FightSide): PreparedEntity | undefined {
  return actualDocuments(state).find((entry) => canUseArenaMap(state, side, entry))
}

export function canUseArenaMap(state: FightState, side: FightSide, entry: PreparedEntity): boolean {
  return Boolean(
    visibleArenaMap(state, entry) &&
    canReadDocument(state, side, entry) &&
    touchesDocument(state, side, entry),
  )
}
