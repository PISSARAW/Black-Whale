import { messagesFor } from '$lib/i18n'
import type { Locale } from '$lib/i18n/config'

export type StrategyHatsuEffect = 'RECON' | 'DENIAL' | 'GUARD' | 'MOBILITY' | 'INFLUENCE'

const strategyMsg = (locale: Locale) => messagesFor(locale).strategy

export const STRATEGY_ABILITY_IDS_BY_CHARACTER: Readonly<Record<string, readonly string[]>> = {
  kurapika: ['emperor-time', 'steal-chain', 'chain-jail', 'dowsing-chain'],
  'queen-oito': ['little-eye'],
  bill: ['erigeron'],
  'prince-benjamin': ['benjamin-aura', 'benjamin-baton', 'air-blow', 'secret-window', 'culdcept'],
  musse: ['secret-window'],
  'prince-camilla': ['cats-name'],
  'hinrigh-biganduffno': ['biohazard-hinrigh'],
  'morena-prudo': ['contagion'],
}

export interface StrategyHatsuContext {
  abilityId: string
  sourceLocationId?: string
  targetLocationId: string
  confirmedHostilesAtTarget: number
  eliminatedAllies: number
  targetHasSpider: boolean
  locale?: Locale
}

export interface StrategyHatsuResolution {
  accepted: boolean
  effects: StrategyHatsuEffect[]
  cooldownTurns: number
  report: string
  error?: string
}

type Adapter = (context: StrategyHatsuContext) => StrategyHatsuResolution

const accepted = (
  effects: StrategyHatsuEffect[],
  cooldownTurns: number,
  report: string,
): StrategyHatsuResolution => ({ accepted: true, effects, cooldownTurns, report })

const refused = (error: string): StrategyHatsuResolution => ({
  accepted: false,
  effects: [],
  cooldownTurns: 0,
  report: error,
  error,
})

const currentLocation = (context: StrategyHatsuContext, name: string) =>
  context.sourceLocationId === context.targetLocationId
    ? null
    : refused(strategyMsg(context.locale ?? 'en').hatsu.canOnlyActivateInOwnZone(name))

const confirmedTarget = (context: StrategyHatsuContext, name: string) =>
  context.confirmedHostilesAtTarget > 0
    ? null
    : refused(strategyMsg(context.locale ?? 'en').hatsu.requiresConfirmedHostile(name))

const SUCCESS_REPORTS: Record<Locale, Record<string, string>> = {
  en: {
    'dowsing-chain': 'Dowsing Chain cross-checks available clues without guaranteeing truth.',
    'little-eye': 'Little Eye observes the area through a controlled insect.',
    'secret-window': 'Secret Window attaches persistent surveillance to the area.',
    'emperor-time':
      "Emperor Time strengthens the local response at the cost of Kurapika's lifespan.",
    'steal-chain': 'Steal Chain drains an observed user and hinders their aura.',
    'chain-jail': 'Chain Jail forces a confirmed Spider into Zetsu.',
    erigeron: 'Erigeron accelerates recovery and consolidates the local unit.',
    'benjamin-aura': 'Benjamin focuses his Ren to strengthen the local defense.',
    'benjamin-baton': 'Benjamin Baton mobilizes the legacy of an eliminated loyal soldier.',
    'air-blow': 'Air Blow strikes an already identified hostile presence at range.',
    culdcept: 'Culdcept temporarily neutralizes an observed opposing ability.',
    'biohazard-hinrigh': 'Biohazard animates objects in the area to control access.',
    contagion: "Contagion extends the Heil-Ly network from Morena's position.",
  },
  fr: {
    'dowsing-chain': 'Dowsing Chain recoupe les indices disponibles sans garantir la vérité.',
    'little-eye': 'Little Eye observe la zone par l’intermédiaire d’un insecte contrôlé.',
    'secret-window': 'Secret Window attache une surveillance persistante à la zone.',
    'emperor-time':
      'Emperor Time renforce la réponse locale, au prix de la durée de vie de Kurapika.',
    'steal-chain': 'Steal Chain draine un utilisateur observé et entrave son aura.',
    'chain-jail': 'Chain Jail impose le Zetsu à une Araignée confirmée.',
    erigeron: 'Erigeron accélère la récupération et consolide l’unité locale.',
    'benjamin-aura': 'Benjamin concentre son Ren pour renforcer la défense locale.',
    'benjamin-baton': 'Benjamin Baton mobilise l’héritage d’un soldat loyal éliminé.',
    'air-blow': 'Air Blow frappe à distance une présence hostile déjà identifiée.',
    culdcept: 'Culdcept neutralise temporairement une capacité adverse observée.',
    'biohazard-hinrigh': 'Biohazard anime les objets de la zone pour en contrôler les accès.',
    contagion: 'Contagion étend le réseau Heil-Ly depuis la position de Morena.',
  },
}

const successReport = (context: StrategyHatsuContext, abilityId: string) =>
  SUCCESS_REPORTS[context.locale ?? 'en'][abilityId]

const ADAPTERS: Record<string, Adapter> = {
  'dowsing-chain': (context) => accepted(['RECON'], 1, successReport(context, 'dowsing-chain')),
  'little-eye': (context) => accepted(['RECON'], 2, successReport(context, 'little-eye')),
  'secret-window': (context) => accepted(['RECON'], 2, successReport(context, 'secret-window')),
  'emperor-time': (context) =>
    currentLocation(context, 'Emperor Time') ??
    accepted(['GUARD'], 3, successReport(context, 'emperor-time')),
  'steal-chain': (context) =>
    confirmedTarget(context, 'Steal Chain') ??
    accepted(['DENIAL'], 3, successReport(context, 'steal-chain')),
  'chain-jail': (context) =>
    context.targetHasSpider
      ? accepted(['DENIAL'], 3, successReport(context, 'chain-jail'))
      : refused(strategyMsg(context.locale ?? 'en').hatsu.chainJailRequiresSpider),
  erigeron: (context) =>
    currentLocation(context, 'Erigeron') ??
    accepted(['GUARD'], 2, successReport(context, 'erigeron')),
  'benjamin-aura': (context) =>
    currentLocation(context, 'Aura Manipulation') ??
    accepted(['GUARD'], 2, successReport(context, 'benjamin-aura')),
  'benjamin-baton': (context) =>
    context.eliminatedAllies > 0
      ? accepted(['DENIAL'], 3, successReport(context, 'benjamin-baton'))
      : refused(strategyMsg(context.locale ?? 'en').hatsu.benjaminBatonRequiresDeath),
  'air-blow': (context) =>
    confirmedTarget(context, 'Air Blow') ??
    accepted(['DENIAL'], 2, successReport(context, 'air-blow')),
  culdcept: (context) =>
    confirmedTarget(context, 'Culdcept') ??
    accepted(['DENIAL'], 3, successReport(context, 'culdcept')),
  'cats-name': (context) => refused(strategyMsg(context.locale ?? 'en').hatsu.catsNamePassive),
  'biohazard-hinrigh': (context) =>
    currentLocation(context, 'Biohazard') ??
    accepted(['DENIAL'], 2, successReport(context, 'biohazard-hinrigh')),
  contagion: (context) =>
    currentLocation(context, 'Contagion') ??
    accepted(['INFLUENCE', 'DENIAL'], 3, successReport(context, 'contagion')),
}

export function strategyHatsuResolution(
  context: StrategyHatsuContext,
  locale: Locale = 'en',
): StrategyHatsuResolution | null {
  // The context carries its own locale for callers that build one; the second
  // argument is the fallback, not an override — it used to silently win.
  const adapterContext = { ...context, locale: context.locale ?? locale }
  return ADAPTERS[context.abilityId]?.(adapterContext) ?? null
}

export function hasStrategyHatsuAdapter(abilityId: string): boolean {
  return Boolean(ADAPTERS[abilityId])
}
