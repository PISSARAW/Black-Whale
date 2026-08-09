import type { Locale } from '$lib/i18n/config'
import type { StrategyDoctrine } from './rules'
import type { StrategyScenarioV2 } from './scenario/types'

type ScenarioCopy = {
  title: string
  description: string
  objectives: Record<string, { title: string; description: string }>
  events: Record<string, { title: string; description: string }>
}

const FR_SCENARIOS: Record<string, ScenarioCopy> = {
  'succession-guards-359': {
    title: 'Guerre des gardes',
    description:
      'Au premier jour du voyage, trois factions déplacent leurs gardes, éprouvent leurs adversaires et cherchent un avantage sans déclencher de guerre ouverte.',
    objectives: {
      'woble-confirm-threats': {
        title: 'Identifier les menaces',
        description: 'Confirmez la position de deux unités hostiles.',
      },
      'woble-hold-1014': {
        title: 'Sanctuaire 1014',
        description: 'Terminez la campagne avec deux défenseurs dans les quartiers de Woble.',
      },
      'benjamin-occupy-sector': {
        title: 'Établir une présence militaire',
        description: 'Occupez trois secteurs distincts avec vos unités.',
      },
      'benjamin-locate-woble': {
        title: 'Dossier Woble',
        description: 'Confirmez deux défenseurs de Woble avant la fin du scénario.',
      },
      'camilla-form-bastion': {
        title: 'Former un bastion',
        description: 'Rassemblez deux unités dans le même secteur.',
      },
      'camilla-expand-influence': {
        title: 'Influence silencieuse',
        description: 'Contrôlez deux secteurs sans rompre de pacte.',
      },
    },
    events: {
      'security-alert': {
        title: 'Alerte de sécurité',
        description: 'Les factions hostiles accélèrent leurs opérations.',
      },
      'communications-blackout': {
        title: 'Coupure des communications',
        description: 'Les investigations à distance ne révèlent aucune nouvelle position ce tour.',
      },
      'tier-lockdown': {
        title: 'Confinement du pont',
        description: 'Les mouvements hostiles deviennent plus rares.',
      },
    },
  },
  'mafia-war-390': {
    title: 'Guerre des ponts inférieurs',
    description:
      'Xi-Yu, Cha-R et Heil-Ly se disputent les passages et les renseignements entre les ponts 2 à 5.',
    objectives: {
      'xiyu-intel': {
        title: 'Cartographier la menace',
        description: 'Confirmez trois agents hostiles.',
      },
      'xiyu-hold': {
        title: 'Protéger la famille',
        description: 'Maintenez deux agents au bureau Xi-Yu.',
      },
      'char-bastion': {
        title: 'Tenir le pont 5',
        description: 'Formez un bastion de deux agents.',
      },
      'char-routes': { title: 'Garder les routes', description: 'Occupez trois secteurs.' },
      'heilly-spread': {
        title: 'Répandre le chaos',
        description: 'Occupez quatre secteurs distincts.',
      },
      'heilly-scout': {
        title: 'Choisir les prochaines cibles',
        description: 'Confirmez deux agents hostiles.',
      },
    },
    events: {
      'mafia-alert': {
        title: 'Avis de recherche',
        description: 'Les familles accélèrent leurs recherches.',
      },
      'mafia-blackout': {
        title: 'Réseau brouillé',
        description: 'Les communications clandestines sont interrompues.',
      },
      'mafia-lockdown': {
        title: 'Portes étanches',
        description: 'Les passages entre les ponts sont ralentis.',
      },
    },
  },
  'succession-lockdown-400': {
    title: 'État d’urgence',
    description: 'Le confinement resserre la guerre de succession autour des quartiers royaux.',
    objectives: {
      'woble-survive': {
        title: 'Préserver le sanctuaire',
        description: 'Maintenez trois défenseurs ensemble.',
      },
      'woble-watch': { title: 'Lire l’encerclement', description: 'Confirmez trois adversaires.' },
      'benjamin-control': {
        title: 'Imposer l’état d’urgence',
        description: 'Occupez quatre secteurs.',
      },
      'benjamin-watch': {
        title: 'Identifier les suspects',
        description: 'Confirmez trois adversaires.',
      },
      'camilla-hold': { title: 'Refuser l’isolement', description: 'Rassemblez trois unités.' },
      'camilla-reach': { title: 'Étendre les relais', description: 'Occupez trois secteurs.' },
    },
    events: {
      'lockdown-alert': { title: 'Mobilisation', description: 'Les gardes prennent position.' },
      'lockdown-blackout': {
        title: 'Canaux coupés',
        description: 'Les communications royales sont brouillées.',
      },
      'lockdown-seal': {
        title: 'Secteurs scellés',
        description: 'Les déplacements deviennent risqués.',
      },
    },
  },
}

export function localizeStrategyScenario(
  scenario: StrategyScenarioV2,
  locale: Locale,
): StrategyScenarioV2 {
  if (locale === 'en') return scenario
  const copy = FR_SCENARIOS[scenario.id]
  if (!copy) return scenario
  return {
    ...scenario,
    title: copy.title,
    description: copy.description,
    playableFactions: scenario.playableFactions.map((faction) => ({
      ...faction,
      publicObjective: {
        ...faction.publicObjective,
        ...(copy.objectives[faction.publicObjective.id] ?? {}),
      },
      secretObjective: {
        ...faction.secretObjective,
        ...(copy.objectives[faction.secretObjective.id] ?? {}),
      },
    })),
    events: scenario.events.map((event) => ({
      ...event,
      ...(copy.events[event.id] ?? {}),
    })),
  }
}

export function doctrineLabel(doctrine: StrategyDoctrine, locale: Locale): string {
  const labels: Record<Locale, Record<StrategyDoctrine, string>> = {
    en: {
      EXPANSION: 'Disperse your units and impose your presence in contested sectors.',
      CONSOLIDATION: 'Gather your forces, secure a stronghold and resist incursions.',
      INTELLIGENCE: 'Identify hostile movements before their intentions become irreversible.',
    },
    fr: {
      EXPANSION: 'Dispersez vos unités et imposez votre présence dans les secteurs contestés.',
      CONSOLIDATION: 'Regroupez vos forces, sécurisez une place forte et résistez aux incursions.',
      INTELLIGENCE:
        'Identifiez les mouvements hostiles avant que leurs intentions deviennent irréversibles.',
    },
  }
  return labels[locale][doctrine]
}
