import type { StrategyScenarioV2 } from './types'

const objective = (input: {
  id: string
  kind: 'OCCUPY_DISTINCT' | 'CONFIRM_HOSTILES' | 'FORM_BASTION'
  title: string
  description: string
  target: number
  secret?: boolean
}) => ({ ...input, secret: input.secret ?? false })

export const GUARDS_359_SCENARIO: StrategyScenarioV2 = {
  schemaVersion: 2,
  id: 'succession-guards-359',
  contentVersion: 1,
  title: 'Guerre des gardes',
  description:
    'Au premier jour de la traversée, trois factions déplacent leurs gardes, testent leurs adversaires et cherchent un avantage sans déclencher une guerre ouverte.',
  chapterNumber: 359,
  maxTurns: 8,
  defaultDifficulty: 'NORMAL',
  playableFactions: [
    {
      factionId: 'prince-woble',
      doctrine: 'INTELLIGENCE',
      initialLocationId: 'tier-1-royal-residential-sector-room-1014',
      requiredCharacterIds: ['kurapika', 'queen-oito', 'bill'],
      publicObjective: objective({
        id: 'woble-confirm-threats',
        kind: 'CONFIRM_HOSTILES',
        title: 'Identifier les menaces',
        description: 'Confirmez la position de deux unités adverses.',
        target: 2,
      }),
      secretObjective: objective({
        id: 'woble-hold-1014',
        kind: 'FORM_BASTION',
        title: 'Sanctuaire 1014',
        description: 'Terminez la campagne avec deux défenseurs dans les quartiers de Woble.',
        target: 2,
        secret: true,
      }),
    },
    {
      factionId: 'prince-benjamin',
      doctrine: 'EXPANSION',
      initialLocationId: 'tier-1-royal-residential-sector-room-1001',
      requiredCharacterIds: ['prince-benjamin', 'balsamilco-might', 'musse'],
      publicObjective: objective({
        id: 'benjamin-occupy-sector',
        kind: 'OCCUPY_DISTINCT',
        title: 'Imposer la présence militaire',
        description: 'Occupez trois secteurs distincts avec vos unités.',
        target: 3,
      }),
      secretObjective: objective({
        id: 'benjamin-locate-woble',
        kind: 'CONFIRM_HOSTILES',
        title: 'Dossier Woble',
        description: 'Confirmez deux défenseurs de Woble avant la fin du scénario.',
        target: 2,
        secret: true,
      }),
    },
    {
      factionId: 'prince-camilla',
      doctrine: 'CONSOLIDATION',
      initialLocationId: 'tier-1-royal-residential-sector-room-1002',
      requiredCharacterIds: ['prince-camilla', 'sarahell', 'moswana'],
      publicObjective: objective({
        id: 'camilla-form-bastion',
        kind: 'FORM_BASTION',
        title: 'Former un bastion',
        description: 'Rassemblez deux unités dans un même secteur.',
        target: 2,
      }),
      secretObjective: objective({
        id: 'camilla-expand-influence',
        kind: 'OCCUPY_DISTINCT',
        title: 'Influence silencieuse',
        description: 'Contrôlez deux secteurs sans rompre un pacte.',
        target: 2,
        secret: true,
      }),
    },
  ],
  locationIds: [
    'tier-1',
    'tier-1-banquet-hall',
    'tier-1-royal-residential-sector',
    'tier-1-royal-residential-sector-room-1001',
    'tier-1-royal-residential-sector-room-1002',
    'tier-1-royal-residential-sector-room-1003',
    'tier-1-royal-residential-sector-room-1004',
    'tier-1-royal-residential-sector-room-1005',
    'tier-1-royal-residential-sector-room-1009',
    'tier-1-royal-residential-sector-room-1012',
    'tier-1-royal-residential-sector-room-1013',
    'tier-1-royal-residential-sector-room-1014',
  ],
  events: [
    {
      id: 'security-alert',
      turn: 2,
      kind: 'ALERT',
      title: 'Alerte de sécurité',
      description: 'Les factions adverses accélèrent leurs opérations.',
      aiMoveMultiplier: 1.25,
    },
    {
      id: 'communications-blackout',
      turn: 4,
      kind: 'BLACKOUT',
      title: 'Coupure des communications',
      description: 'Les enquêtes à distance ne révèlent aucune nouvelle position ce tour.',
      aiMoveMultiplier: 1,
    },
    {
      id: 'tier-lockdown',
      turn: 6,
      kind: 'LOCKDOWN',
      title: 'Confinement des ponts',
      description: 'Les déplacements adverses deviennent plus rares.',
      aiMoveMultiplier: 0.5,
    },
  ],
  failureConditions: ['TURN_LIMIT', 'FACTION_ELIMINATED'],
  provenance: [
    {
      sourceId: 'chapter-359',
      chapter: 359,
      note: 'Départ du Black Whale, répartition initiale des princes et de leurs gardes.',
    },
  ],
}
