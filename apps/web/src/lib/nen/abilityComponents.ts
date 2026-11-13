import type { Component } from 'svelte'
import type { AbilityViewModel } from './abilityPresentation'

export type AbilityViewFamily =
  'gauge' | 'ledger' | 'network' | 'steps' | 'target' | 'map' | 'timeline'

export type AbilityViewComponent = Component<{
  model: AbilityViewModel
  variant?: string
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

const view = (load: () => Promise<unknown>): AbilityComponentLoader =>
  load as AbilityComponentLoader

/**
 * One lazy module per manifest key. The small modules in `views/` own their
 * identity, primitive family and palette while composing the shared frame.
 * Keeping the import paths literal lets Vite split them independently instead
 * of turning seventy declared views into one disguised generic fallback.
 */
export const ABILITY_COMPONENTS = Object.freeze({
  AbilityLoanPanel: view(() => import('./views/AbilityLoanPanel.svelte')),
  AntennaControl: view(() => import('./views/AntennaControl.svelte')),
  AstralDoubleView: view(() => import('./views/AstralDoubleView.svelte')),
  AuraGauge: view(() => import('./views/AuraGauge.svelte')),
  BanditsSecretBook: view(() => import('./views/BanditsSecretBook.svelte')),
  BarrageView: view(() => import('./views/BarrageView.svelte')),
  BatonRoster: view(() => import('./views/BatonRoster.svelte')),
  BattleCantabileView: view(() => import('./views/BattleCantabileView.svelte')),
  BloodControl: view(() => import('./views/BloodControl.svelte')),
  BloodlineSuccessionPanel: view(() => import('./views/BloodlineSuccessionPanel.svelte')),
  BodyWeaponView: view(() => import('./views/BodyWeaponView.svelte')),
  BoostGauge: view(() => import('./views/BoostGauge.svelte')),
  BungeeGumInteraction: view(() => import('./views/BungeeGumInteraction.svelte')),
  CardCapture: view(() => import('./views/CardCapture.svelte')),
  CatsNameWarning: view(() => import('./views/CatsNameWarning.svelte')),
  ChainInteraction: view(() => import('./views/ChainInteraction.svelte')),
  ChargeGauge: view(() => import('./views/ChargeGauge.svelte')),
  CoinLedger: view(() => import('./views/CoinLedger.svelte')),
  ComboMasterInteraction: view(() => import('./views/ComboMasterInteraction.svelte')),
  ConfettiMarkers: view(() => import('./views/ConfettiMarkers.svelte')),
  CongregationLedger: view(() => import('./views/CongregationLedger.svelte')),
  ContagionDashboard: view(() => import('./ContagionDashboard.svelte')),
  ContagionHeatmap: view(() => import('./views/ContagionHeatmap.svelte')),
  ContainerView: view(() => import('./views/ContainerView.svelte')),
  ContractPanel: view(() => import('./views/ContractPanel.svelte')),
  ConvertHandsView: view(() => import('./views/ConvertHandsView.svelte')),
  CopyLedger: view(() => import('./views/CopyLedger.svelte')),
  CrossGameCards: view(() => import('./views/CrossGameCards.svelte')),
  DamageLedger: view(() => import('./views/DamageLedger.svelte')),
  DesireTrapView: view(() => import('./views/DesireTrapView.svelte')),
  DuplicatedRoomView: view(() => import('./views/DuplicatedRoomView.svelte')),
  EmperorTimeGauge: view(() => import('./views/EmperorTimeGauge.svelte')),
  FatigueGauge: view(() => import('./views/FatigueGauge.svelte')),
  FilamentInteraction: view(() => import('./views/FilamentInteraction.svelte')),
  FlockView: view(() => import('./views/FlockView.svelte')),
  FormToggle: view(() => import('./views/FormToggle.svelte')),
  GrimmelArrowView: view(() => import('./views/GrimmelArrowView.svelte')),
  GuardianBeastView: view(() => import('./views/GuardianBeastView.svelte')),
  HaikuScroll: view(() => import('./views/HaikuScroll.svelte')),
  HatredGauge: view(() => import('./views/HatredGauge.svelte')),
  InterrogationPanel: view(() => import('./views/InterrogationPanel.svelte')),
  LieMarkCounter: view(() => import('./views/LieMarkCounter.svelte')),
  LittleEyeScout: view(() => import('./views/LittleEyeScout.svelte')),
  LivingObjectView: view(() => import('./views/LivingObjectView.svelte')),
  LoveDialSearch: view(() => import('./views/LoveDialSearch.svelte')),
  MagicalWormTunnel: view(() => import('./views/MagicalWormTunnel.svelte')),
  MelodyHearing: view(() => import('./views/MelodyHearing.svelte')),
  MetamorphosenView: view(() => import('./views/MetamorphosenView.svelte')),
  NeedlePuppetView: view(() => import('./views/NeedlePuppetView.svelte')),
  OwlScreenWall: view(() => import('./views/OwlScreenWall.svelte')),
  PainPackerArmour: view(() => import('./views/PainPackerArmour.svelte')),
  PaperDollSurveillance: view(() => import('./views/PaperDollSurveillance.svelte')),
  ParallelFutureView: view(() => import('./views/ParallelFutureView.svelte')),
  PortalNetworkView: view(() => import('./views/PortalNetworkView.svelte')),
  PredatorAnalysisGauge: view(() => import('./views/PredatorAnalysisGauge.svelte')),
  ProphecyPoem: view(() => import('./views/ProphecyPoem.svelte')),
  PuppetCrowd: view(() => import('./views/PuppetCrowd.svelte')),
  RemoteStrikeView: view(() => import('./views/RemoteStrikeView.svelte')),
  RisingSunBurst: view(() => import('./views/RisingSunBurst.svelte')),
  RuleZonePanel: view(() => import('./views/RuleZonePanel.svelte')),
  SacrificialCurseGraph: view(() => import('./views/SacrificialCurseGraph.svelte')),
  SensesView: view(() => import('./views/SensesView.svelte')),
  SilentMajorityPuppet: view(() => import('./views/SilentMajorityPuppet.svelte')),
  StaffView: view(() => import('./views/StaffView.svelte')),
  SunMoonMarks: view(() => import('./views/SunMoonMarks.svelte')),
  SynthesisBench: view(() => import('./views/SynthesisBench.svelte')),
  TextureSurpriseView: view(() => import('./views/TextureSurpriseView.svelte')),
  VehicleView: view(() => import('./views/VehicleView.svelte')),
  WithoutYouView: view(() => import('./views/WithoutYouView.svelte')),
  ZetsuTestView: view(() => import('./views/ZetsuTestView.svelte')),
} satisfies Record<AbilityComponentKey, AbilityComponentLoader>)

export function familyFor(componentKey: string | null | undefined): AbilityViewFamily | null {
  if (!componentKey) return null
  return ABILITY_VIEW_FAMILIES[componentKey as AbilityComponentKey] ?? null
}

export function componentFor(
  componentKey: string | null | undefined,
): AbilityComponentLoader | null {
  if (!componentKey) return null
  return ABILITY_COMPONENTS[componentKey as AbilityComponentKey] ?? null
}
