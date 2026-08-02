import type { StrategyScenarioV2 } from './types'

export const LOCKDOWN_SCENARIO: StrategyScenarioV2 = {
  schemaVersion: 2,
  id: 'succession-lockdown-400',
  contentVersion: 1,
  title: 'État d’urgence',
  description: 'Le confinement resserre la guerre de succession autour des quartiers royaux.',
  chapterNumber: 400,
  maxTurns: 8,
  defaultDifficulty: 'EXPERT',
  playableFactions: [
    {
      factionId: 'prince-woble', doctrine: 'INTELLIGENCE', initialLocationId: 'tier-1-royal-residential-sector-room-1014', requiredCharacterIds: ['kurapika', 'queen-oito', 'bill'],
      publicObjective: { id: 'woble-survive', kind: 'FORM_BASTION', title: 'Préserver le sanctuaire', description: 'Maintenez trois défenseurs ensemble.', target: 3, secret: false },
      secretObjective: { id: 'woble-watch', kind: 'CONFIRM_HOSTILES', title: 'Lire l’encerclement', description: 'Confirmez trois adversaires.', target: 3, secret: true },
    },
    {
      factionId: 'prince-benjamin', doctrine: 'EXPANSION', initialLocationId: 'tier-1-royal-residential-sector-room-1001', requiredCharacterIds: ['prince-benjamin', 'balsamilco-might', 'musse'],
      publicObjective: { id: 'benjamin-control', kind: 'OCCUPY_DISTINCT', title: 'Imposer l’état d’urgence', description: 'Occupez quatre secteurs.', target: 4, secret: false },
      secretObjective: { id: 'benjamin-watch', kind: 'CONFIRM_HOSTILES', title: 'Désigner les suspects', description: 'Confirmez trois adversaires.', target: 3, secret: true },
    },
    {
      factionId: 'prince-camilla', doctrine: 'CONSOLIDATION', initialLocationId: 'tier-1-royal-residential-sector-room-1002', requiredCharacterIds: ['prince-camilla', 'sarahell', 'moswana'],
      publicObjective: { id: 'camilla-hold', kind: 'FORM_BASTION', title: 'Refuser l’isolement', description: 'Rassemblez trois unités.', target: 3, secret: false },
      secretObjective: { id: 'camilla-reach', kind: 'OCCUPY_DISTINCT', title: 'Étendre les relais', description: 'Occupez trois secteurs.', target: 3, secret: true },
    },
  ],
  locationIds: ['tier-1', 'tier-1-banquet-hall', 'tier-1-royal-residential-sector', 'tier-1-royal-residential-sector-room-1001', 'tier-1-royal-residential-sector-room-1002', 'tier-1-royal-residential-sector-room-1004', 'tier-1-royal-residential-sector-room-1005', 'tier-1-royal-residential-sector-room-1009', 'tier-1-royal-residential-sector-room-1012', 'tier-1-royal-residential-sector-room-1013', 'tier-1-royal-residential-sector-room-1014'],
  events: [
    { id: 'lockdown-alert', turn: 1, kind: 'ALERT', title: 'Mobilisation', description: 'Les gardes prennent position.', aiMoveMultiplier: 1.25 },
    { id: 'lockdown-blackout', turn: 3, kind: 'BLACKOUT', title: 'Canaux coupés', description: 'Les communications royales sont brouillées.', aiMoveMultiplier: 1 },
    { id: 'lockdown-seal', turn: 6, kind: 'LOCKDOWN', title: 'Secteurs scellés', description: 'Les mouvements deviennent risqués.', aiMoveMultiplier: 0.5 },
  ],
  failureConditions: ['TURN_LIMIT', 'FACTION_ELIMINATED'],
  provenance: [{ sourceId: 'chapter-400', chapter: 400, note: 'Projection non canonique d’un durcissement de la sécurité du niveau 1.' }],
}
