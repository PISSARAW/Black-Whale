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

const ADAPTERS: Record<string, Adapter> = {
  'dowsing-chain': () =>
    accepted(['RECON'], 1, 'Dowsing Chain recoupe les indices disponibles sans garantir la vérité.'),
  'little-eye': () =>
    accepted(['RECON'], 2, 'Little Eye observe la zone par l’intermédiaire d’un insecte contrôlé.'),
  'secret-window': () =>
    accepted(['RECON'], 2, 'Secret Window attache une surveillance persistante à la zone.'),
  'emperor-time': (context) =>
    currentLocation(context, 'Emperor Time') ??
    accepted(['GUARD'], 3, 'Emperor Time renforce la réponse locale, au prix de la durée de vie de Kurapika.'),
  'steal-chain': (context) =>
    confirmedTarget(context, 'Steal Chain') ??
    accepted(['DENIAL'], 3, 'Steal Chain draine un utilisateur observé et entrave son aura.'),
  'chain-jail': (context) =>
    context.targetHasSpider
      ? accepted(['DENIAL'], 3, 'Chain Jail impose le Zetsu à une Araignée confirmée.')
      : refused(strategyMsg(context.locale ?? 'en').hatsu.chainJailRequiresSpider),
  erigeron: (context) =>
    currentLocation(context, 'Erigeron') ??
    accepted(['GUARD'], 2, 'Erigeron accélère la récupération et consolide l’unité locale.'),
  'benjamin-aura': (context) =>
    currentLocation(context, 'Aura Manipulation') ??
    accepted(['GUARD'], 2, 'Benjamin concentre son Ren pour renforcer la défense locale.'),
  'benjamin-baton': (context) =>
    context.eliminatedAllies > 0
      ? accepted(['DENIAL'], 3, 'Benjamin Baton mobilise l’héritage d’un soldat loyal éliminé.')
      : refused(strategyMsg(context.locale ?? 'en').hatsu.benjaminBatonRequiresDeath),
  'air-blow': (context) =>
    confirmedTarget(context, 'Air Blow') ??
    accepted(['DENIAL'], 2, 'Air Blow frappe à distance une présence hostile déjà identifiée.'),
  culdcept: (context) =>
    confirmedTarget(context, 'Culdcept') ??
    accepted(['DENIAL'], 3, 'Culdcept neutralise temporairement une capacité adverse observée.'),
  'cats-name': (context) =>
    refused(strategyMsg(context.locale ?? 'en').hatsu.catsNamePassive),
  'biohazard-hinrigh': (context) =>
    currentLocation(context, 'Biohazard') ??
    accepted(['DENIAL'], 2, 'Biohazard anime les objets de la zone pour en contrôler les accès.'),
  contagion: (context) =>
    currentLocation(context, 'Contagion') ??
    accepted(['INFLUENCE', 'DENIAL'], 3, 'Contagion étend le réseau Heil-Ly depuis la position de Morena.'),
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
