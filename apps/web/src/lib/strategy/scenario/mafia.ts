import type { StrategyScenarioV2 } from './types'

export const MAFIA_WAR_SCENARIO: StrategyScenarioV2 = {
  schemaVersion: 2,
  id: 'mafia-war-390',
  contentVersion: 1,
  title: 'Guerre des niveaux inférieurs',
  description: 'Xi-Yu, Cha-R et Heil-Ly se disputent les passages et le renseignement entre les niveaux 2 à 5.',
  chapterNumber: 390,
  maxTurns: 8,
  defaultDifficulty: 'NORMAL',
  playableFactions: [
    {
      factionId: 'mafia-xiyu',
      doctrine: 'INTELLIGENCE',
      initialLocationId: 'tier-4-xi-yu-family-office',
      requiredCharacterIds: ['hinrigh-biganduffno', 'lynch-fullbokko', 'zakuro-custard'],
      publicObjective: { id: 'xiyu-intel', kind: 'CONFIRM_HOSTILES', title: 'Cartographier la menace', description: 'Confirmez trois agents adverses.', target: 3, secret: false },
      secretObjective: { id: 'xiyu-hold', kind: 'FORM_BASTION', title: 'Protéger la famille', description: 'Conservez deux agents au bureau Xi-Yu.', target: 2, secret: true },
    },
    {
      factionId: 'mafia-char',
      doctrine: 'CONSOLIDATION',
      initialLocationId: 'tier-5-cha-r-family-office',
      requiredCharacterIds: ['keni-wang', 'brocco-li', 'padaille'],
      publicObjective: { id: 'char-bastion', kind: 'FORM_BASTION', title: 'Tenir le niveau 5', description: 'Formez un bastion de deux agents.', target: 2, secret: false },
      secretObjective: { id: 'char-routes', kind: 'OCCUPY_DISTINCT', title: 'Garder les routes', description: 'Occupez trois secteurs.', target: 3, secret: true },
    },
    {
      factionId: 'mafia-heilly',
      doctrine: 'EXPANSION',
      initialLocationId: 'tier-2-heilly-secret-hideout',
      requiredCharacterIds: ['morena-prudo', 'dogman', 'yokotani'],
      publicObjective: { id: 'heilly-spread', kind: 'OCCUPY_DISTINCT', title: 'Étendre le chaos', description: 'Occupez quatre secteurs distincts.', target: 4, secret: false },
      secretObjective: { id: 'heilly-scout', kind: 'CONFIRM_HOSTILES', title: 'Choisir les prochaines cibles', description: 'Confirmez deux agents adverses.', target: 2, secret: true },
    },
  ],
  locationIds: ['tier-2', 'tier-2-heilly-secret-hideout', 'tier-2-bulkhead', 'tier-3', 'tier-3-heilly-family-office', 'tier-4', 'tier-4-xi-yu-family-office', 'tier-4-central-passage', 'tier-5', 'tier-5-cha-r-family-office', 'tier-5-central-dining-hall', 'tier-5-warehouse'],
  events: [
    { id: 'mafia-alert', turn: 2, kind: 'ALERT', title: 'Avis de recherche', description: 'Les familles accélèrent leurs recherches.', aiMoveMultiplier: 1.25 },
    { id: 'mafia-blackout', turn: 5, kind: 'BLACKOUT', title: 'Réseau brouillé', description: 'Les communications clandestines sont interrompues.', aiMoveMultiplier: 1 },
    { id: 'mafia-lockdown', turn: 7, kind: 'LOCKDOWN', title: 'Portes étanches', description: 'Les passages entre niveaux sont ralentis.', aiMoveMultiplier: 0.5 },
  ],
  failureConditions: ['TURN_LIMIT', 'FACTION_ELIMINATED'],
  provenance: [{ sourceId: 'chapter-390', chapter: 390, note: 'Conflit entre les trois mafias dans les niveaux inférieurs.' }],
}
