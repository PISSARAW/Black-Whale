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
  title: 'Guard War',
  description:
    'On the first day of the voyage, three factions move their guards, test their adversaries, and seek an advantage without triggering open war.',
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
        title: 'Identify Threats',
        description: 'Confirm the position of two hostile units.',
        target: 2,
      }),
      secretObjective: objective({
        id: 'woble-hold-1014',
        kind: 'FORM_BASTION',
        title: 'Sanctuary 1014',
        description: 'Finish the campaign with two defenders in Woble\'s quarters.',
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
        title: 'Establish Military Presence',
        description: 'Occupy three distinct sectors with your units.',
        target: 3,
      }),
      secretObjective: objective({
        id: 'benjamin-locate-woble',
        kind: 'CONFIRM_HOSTILES',
        title: 'Woble Dossier',
        description: 'Confirm two of Woble\'s defenders before the end of the scenario.',
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
        title: 'Form a Bastion',
        description: 'Gather two units in the same sector.',
        target: 2,
      }),
      secretObjective: objective({
        id: 'camilla-expand-influence',
        kind: 'OCCUPY_DISTINCT',
        title: 'Silent Influence',
        description: 'Control two sectors without breaking a pact.',
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
      title: 'Security Alert',
      description: 'Hostile factions accelerate their operations.',
      aiMoveMultiplier: 1.25,
    },
    {
      id: 'communications-blackout',
      turn: 4,
      kind: 'BLACKOUT',
      title: 'Communications Blackout',
      description: 'Remote investigations reveal no new positions this turn.',
      aiMoveMultiplier: 1,
    },
    {
      id: 'tier-lockdown',
      turn: 6,
      kind: 'LOCKDOWN',
      title: 'Deck Lockdown',
      description: 'Hostile movements become rarer.',
      aiMoveMultiplier: 0.5,
    },
  ],
  failureConditions: ['TURN_LIMIT', 'FACTION_ELIMINATED'],
  provenance: [
    {
      sourceId: 'chapter-359',
      chapter: 359,
      note: 'Departure from Black Whale, initial distribution of princes and their guards.',
    },
  ],
}
