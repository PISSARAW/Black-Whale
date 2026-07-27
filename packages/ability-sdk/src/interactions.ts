import type {
  AbilityInteraction,
  AbilityInteractionManifest,
  ActionVisibility,
  NenActionWheelEntry,
  NenAllowedTarget,
  NenInteractionMode,
  NenOverlayType,
  NenPerspectiveTransition,
} from '@black-whale/nen-engine'

// ──────────────────────────────────────────────
// Target builders
// ──────────────────────────────────────────────

export type TargetType = 'person' | 'object' | 'surface' | 'self' | 'zone' | 'aura' | 'body'

export const person = (): TargetType => 'person'
export const object = (): TargetType => 'object'
export const surface = (): TargetType => 'surface'
export const self = (): TargetType => 'self'
export const zone = (): TargetType => 'zone'
export const aura = (): TargetType => 'aura'
export const body = (): TargetType => 'body'

// ──────────────────────────────────────────────
// Interaction builders
// ──────────────────────────────────────────────

export type InteractionBuilder = () => AbilityInteraction

export const interaction = (
  id: string,
  label: string,
  targetTypes: string[] = [],
  conditions: string[] = [],
): AbilityInteraction => ({ id, label, targetTypes, conditions })

export const attach = (): AbilityInteraction => interaction('attach', 'Attach')
export const stretch = (): AbilityInteraction => interaction('stretch', 'Stretch')
export const retract = (): AbilityInteraction => interaction('retract', 'Retract')
export const detach = (): AbilityInteraction => interaction('detach', 'Detach')
export const release = (): AbilityInteraction => interaction('release', 'Release')

// ──────────────────────────────────────────────
// Interaction manifest builders (section 18)
// ──────────────────────────────────────────────

export interface ManifestOptions {
  inputMode: NenInteractionMode
  allowedTargets: NenAllowedTarget[]
  overlays?: NenOverlayType[]
  entryActions?: string[]
  requiredState?: string[]
  perspectiveTransition?: NenPerspectiveTransition
  customComponent?: string
}

/**
 * Build a fully-typed AbilityInteractionManifest for a given ability.
 */
export function buildManifest(
  abilityId: string,
  opts: ManifestOptions,
): AbilityInteractionManifest {
  return {
    abilityId,
    entryPoints: {
      actions: opts.entryActions ?? [],
      requiredState: opts.requiredState ?? [],
    },
    inputMode: opts.inputMode,
    allowedTargets: opts.allowedTargets,
    overlays: opts.overlays ?? [],
    perspectiveTransition: opts.perspectiveTransition,
    customComponent: opts.customComponent,
  }
}

// ──────────────────────────────────────────────
// Action wheel helpers
// ──────────────────────────────────────────────

export interface WheelEntryOptions {
  id: string
  label: string
  abilityId: string
  visibility?: ActionVisibility
  hint?: string
}

export function wheelEntry(opts: WheelEntryOptions): NenActionWheelEntry {
  return {
    id: opts.id,
    label: opts.label,
    abilityId: opts.abilityId,
    visibility: opts.visibility ?? 'available',
    hint: opts.hint,
  }
}
