/**
 * Where a Clash duel is fought.
 *
 * The engine's lane, timer and scoring format stay the same on every stage.
 * LSDF additionally requires the hideout scenario. `ship-room` stages name a
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
  | 'supreme-court'
  | 'princes-burial-chamber'
  | 'heilly-hideout'

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
  {
    id: 'supreme-court',
    kind: 'ship-room',
    spaceId: 'tier-1-supreme-court',
    nameFr: 'Cour suprême',
    nameEn: 'Supreme Court',
    noteFr: 'Pont 1 · pièce de la visite',
    noteEn: 'Tier 1 · room from the visit',
    swatch: ['#3a2a1e', '#c9a86a'],
  },
  {
    id: 'princes-burial-chamber',
    kind: 'ship-room',
    spaceId: 'tier-1-princes-burial-chamber-rotunda',
    nameFr: 'Chambre funéraire des princes',
    nameEn: 'Princes’ burial chamber',
    noteFr: 'Pont 1-C · quatorze cercueils et appareil rituel',
    noteEn: 'Tier 1-C · fourteen coffins and ritual apparatus',
    swatch: ['#24201c', '#f59e0b'],
  },
  {
    id: 'heilly-hideout',
    kind: 'ship-room',
    spaceId: 'tier-2-heilly-secret-hideout-corridor',
    nameFr: 'Planque Heil-Ly',
    nameEn: 'Heil-Ly hideout',
    noteFr: 'LSDF : Morena présente et intrus en infraction requis',
    noteEn: 'LSDF requires Morena’s presence and unlawful intruders',
    swatch: ['#353b38', '#c4bb9a'],
  },
]

export function fightStage(id: FightStageId): FightStageDefinition {
  return FIGHT_STAGES.find((stage) => stage.id === id) ?? FIGHT_STAGES[0]
}
