import type { Component } from 'svelte'
import type { AbilityViewModel } from './abilityPresentation'

export type AbilityViewFamily =
  'gauge' | 'ledger' | 'network' | 'steps' | 'target' | 'map' | 'timeline'

export type AbilityViewComponent = Component<{
  model: AbilityViewModel
  variant: string
  family?: AbilityViewFamily
}>
export type AbilityComponentLoader = () => Promise<{ default: AbilityViewComponent }>

/**
 * Visual grammar explicitly chosen for every component key published by the
 * modules. Keeping this exhaustive prevents a new manifest from silently
 * falling into a guessed presentation.
 */
export const ABILITY_VIEW_FAMILIES = {
  AbilityLoanPanel: 'steps',
  AntennaControl: 'network',
  AstralDoubleView: 'target',
  AuraGauge: 'gauge',
  BanditsSecretBook: 'ledger',
  BarrageView: 'timeline',
  BatonRoster: 'ledger',
  BattleCantabileView: 'timeline',
  BloodControl: 'target',
  BloodlineSuccessionPanel: 'steps',
  BodyWeaponView: 'target',
  BoostGauge: 'gauge',
  BungeeGumInteraction: 'target',
  CardCapture: 'ledger',
  CatsNameWarning: 'timeline',
  ChainInteraction: 'target',
  ChargeGauge: 'gauge',
  CoinLedger: 'ledger',
  ComboMasterInteraction: 'steps',
  ConfettiMarkers: 'map',
  CongregationLedger: 'ledger',
  ContagionDashboard: 'network',
  ContagionHeatmap: 'map',
  ContainerView: 'target',
  ContractPanel: 'steps',
  ConvertHandsView: 'target',
  CopyLedger: 'ledger',
  CrossGameCards: 'ledger',
  DamageLedger: 'ledger',
  DesireTrapView: 'target',
  DuplicatedRoomView: 'map',
  EmperorTimeGauge: 'gauge',
  FatigueGauge: 'gauge',
  FilamentInteraction: 'target',
  FlockView: 'network',
  FormToggle: 'steps',
  GrimmelArrowView: 'target',
  GuardianBeastView: 'target',
  HaikuScroll: 'ledger',
  HatredGauge: 'gauge',
  InterrogationPanel: 'steps',
  LieMarkCounter: 'gauge',
  LittleEyeScout: 'map',
  LivingObjectView: 'target',
  LoveDialSearch: 'map',
  MagicalWormTunnel: 'map',
  MelodyHearing: 'timeline',
  MetamorphosenView: 'steps',
  NeedlePuppetView: 'network',
  OwlScreenWall: 'map',
  PainPackerArmour: 'gauge',
  PaperDollSurveillance: 'map',
  ParallelFutureView: 'timeline',
  PortalNetworkView: 'network',
  PredatorAnalysisGauge: 'gauge',
  ProphecyPoem: 'ledger',
  PuppetCrowd: 'network',
  RemoteStrikeView: 'target',
  RisingSunBurst: 'gauge',
  RuleZonePanel: 'map',
  SacrificialCurseGraph: 'network',
  SensesView: 'target',
  SilentMajorityPuppet: 'network',
  StaffView: 'target',
  SunMoonMarks: 'target',
  SynthesisBench: 'steps',
  TextureSurpriseView: 'target',
  VehicleView: 'map',
  WithoutYouView: 'timeline',
  ZetsuTestView: 'steps',
} as const satisfies Record<string, AbilityViewFamily>

export type AbilityComponentKey = keyof typeof ABILITY_VIEW_FAMILIES

const loaderFor = (key: AbilityComponentKey): AbilityComponentLoader => {
  if (key === 'ContagionDashboard') {
    return () =>
      import('./ContagionDashboard.svelte') as unknown as Promise<{
        default: AbilityViewComponent
      }>
  }
  return () => import('./AbilityCompositeView.svelte') as Promise<{ default: AbilityViewComponent }>
}

/** Every manifest key owns a lazy loader and composes one shared visual primitive. */
export const ABILITY_COMPONENTS: Readonly<Record<string, AbilityComponentLoader>> = Object.freeze(
  Object.fromEntries(
    (Object.keys(ABILITY_VIEW_FAMILIES) as AbilityComponentKey[]).map((key) => [
      key,
      loaderFor(key),
    ]),
  ),
)

export function familyFor(componentKey: string | null | undefined): AbilityViewFamily | null {
  if (!componentKey) return null
  return ABILITY_VIEW_FAMILIES[componentKey as AbilityComponentKey] ?? null
}

export function componentFor(
  componentKey: string | null | undefined,
): AbilityComponentLoader | null {
  if (!componentKey) return null
  return ABILITY_COMPONENTS[componentKey] ?? null
}
