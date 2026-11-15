/**
 * Where a Clash duel is fought.
 *
 * A stage is scenery only: the engine's lane, timer and rules are the same on
 * every one of them. `ship-room` stages are not authored here — they name a
 * space of `data/ship/blueprint.json` and the scene raises that room from the
 * same mesh the visit walks through.
 */
export type FightStageId =
  | 'whale-hold'
  | 'heavens-arena'
  | 'banquet-hall'
  | 'vip-casino'
  | 'observation-deck'
  | 'screening-room'

export type FightStageKind = 'hold' | 'heavens-arena' | 'ship-room'

export interface FightStageDefinition {
  id: FightStageId
  kind: FightStageKind
  /** The blueprint space a `ship-room` stage is raised from. */
  spaceId: string | null
  nameFr: string
  nameEn: string
  noteFr: string
  noteEn: string
  /** Two colours for the picker's swatch: floor, then light. */
  swatch: readonly [string, string]
}

export const DEFAULT_FIGHT_STAGE: FightStageId = 'whale-hold'

export const FIGHT_STAGES: readonly FightStageDefinition[] = [
  {
    id: 'whale-hold',
    kind: 'hold',
    spaceId: null,
    nameFr: 'Soute du Black Whale',
    nameEn: 'Black Whale hold',
    noteFr: 'Décor d’origine du mode',
    noteEn: 'The mode’s original backdrop',
    swatch: ['#0b1015', '#59717f'],
  },
  {
    id: 'heavens-arena',
    kind: 'heavens-arena',
    spaceId: null,
    nameFr: 'Tour Céleste',
    nameEn: 'Heavens Arena',
    noteFr: 'Ring de pierre et gradins',
    noteEn: 'Stone ring and stands',
    swatch: ['#b9b3a2', '#f2d27a'],
  },
  {
    id: 'banquet-hall',
    kind: 'ship-room',
    spaceId: 'tier-1-banquet-hall',
    nameFr: 'Salle du banquet',
    nameEn: 'Banquet hall',
    noteFr: 'Pont 1 · pièce de la visite',
    noteEn: 'Tier 1 · room from the visit',
    swatch: ['#3b2a22', '#d8b36a'],
  },
  {
    id: 'vip-casino',
    kind: 'ship-room',
    spaceId: 'tier-1-vip-casino',
    nameFr: 'Casino VIP',
    nameEn: 'VIP casino',
    noteFr: 'Pont 1 · pièce de la visite',
    noteEn: 'Tier 1 · room from the visit',
    swatch: ['#1f3a2c', '#c9a24a'],
  },
  {
    id: 'observation-deck',
    kind: 'ship-room',
    spaceId: 'tier-3-observation-deck',
    nameFr: 'Pont d’observation',
    nameEn: 'Observation deck',
    noteFr: 'Pont 3 · pièce de la visite',
    noteEn: 'Tier 3 · room from the visit',
    swatch: ['#1b2a36', '#9edcff'],
  },
  {
    id: 'screening-room',
    kind: 'ship-room',
    spaceId: 'tier-2-screening-room',
    nameFr: 'Salle de projection',
    nameEn: 'Screening room',
    noteFr: 'Pont 2 · pièce de la visite',
    noteEn: 'Tier 2 · room from the visit',
    swatch: ['#231c2b', '#8f7bd0'],
  },
]

export function fightStage(id: FightStageId): FightStageDefinition {
  return FIGHT_STAGES.find((stage) => stage.id === id) ?? FIGHT_STAGES[0]
}
