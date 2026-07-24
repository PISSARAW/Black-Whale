import type {
  NenAbilityModule,
  AbilityManifest,
  AbilityContext,
  ValidationResult,
  AbilityResult,
  AbilityInteraction,
  PerspectiveModifier,
  AbilityUIComponent,
  AbilityInteractionManifest,
  NenInteractionMode,
  NenAllowedTarget,
  NenOverlayType,
  NenPerspectiveTransition,
  NenActionWheelEntry,
  ActionAvailability,
  ActionVisibility,
} from '@black-whale/nen-engine'

// ──────────────────────────────────────────────
// Condition builders
// ──────────────────────────────────────────────

export type ConditionFn = (ctx: AbilityContext) => boolean

export const canUseNen = (): ConditionFn => (_ctx) => {
  throw new Error('canUseNen: requires runtime world state')
}

export const isConscious = (): ConditionFn => (_ctx) => {
  throw new Error('isConscious: requires runtime world state')
}

export const isAlive = (): ConditionFn => (_ctx) => {
  throw new Error('isAlive: requires runtime world state')
}

export const maxDistance = (_meters: number): ConditionFn => (_ctx) => {
  throw new Error('maxDistance: requires runtime world state')
}

// ──────────────────────────────────────────────
// Target builders
// ──────────────────────────────────────────────

export type TargetType = 'person' | 'object' | 'surface' | 'self' | 'zone'

export const person = (): TargetType => 'person'
export const object = (): TargetType => 'object'
export const surface = (): TargetType => 'surface'
export const self = (): TargetType => 'self'
export const zone = (): TargetType => 'zone'

// ──────────────────────────────────────────────
// Interaction builders
// ──────────────────────────────────────────────

export type InteractionBuilder = () => AbilityInteraction

export const attach = (): AbilityInteraction => ({ id: 'attach', label: 'Attach', targetTypes: [], conditions: [] })
export const stretch = (): AbilityInteraction => ({ id: 'stretch', label: 'Stretch', targetTypes: [], conditions: [] })
export const retract = (): AbilityInteraction => ({ id: 'retract', label: 'Retract', targetTypes: [], conditions: [] })
export const detach = (): AbilityInteraction => ({ id: 'detach', label: 'Detach', targetTypes: [], conditions: [] })
export const release = (): AbilityInteraction => ({ id: 'release', label: 'Release', targetTypes: [], conditions: [] })

// ──────────────────────────────────────────────
// Effect builders
// ──────────────────────────────────────────────

export type EffectBuilder = () => { type: string; payload?: Record<string, unknown> }

export const elasticConnection = (): EffectBuilder => () => ({ type: 'elastic_connection' })
export const adhesiveConnection = (): EffectBuilder => () => ({ type: 'adhesive_connection' })
export const transferConsciousness = (): EffectBuilder => () => ({ type: 'consciousness_transfer' })
export const teleport = (): EffectBuilder => () => ({ type: 'teleport' })
export const detectAura = (): EffectBuilder => () => ({ type: 'aura_detection' })

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
export function buildManifest(abilityId: string, opts: ManifestOptions): AbilityInteractionManifest {
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

// ──────────────────────────────────────────────
// defineAbility — main SDK entry point
// ──────────────────────────────────────────────

export interface AbilityDefinition {
  id: string
  owner: string
  conditions?: ConditionFn[]
  targets?: TargetType[]
  interactions?: AbilityInteraction[]
  effects?: EffectBuilder[]
  ui?: AbilityUIComponent
  /** Full interaction contract (section 18) */
  interactionManifest?: AbilityInteractionManifest
  /** Static action wheel entries for this ability */
  actionWheel?: NenActionWheelEntry[]
}

export function defineAbility(def: AbilityDefinition): NenAbilityModule {
  const manifest: AbilityManifest = {
    id: def.id,
    name: def.id,
    ownerId: def.owner,
    category: 'unknown',
    version: '0.0.1',
  }

  return {
    manifest,

    validateActivation(ctx: AbilityContext): ValidationResult {
      if (!def.conditions) return { allowed: true }
      for (const condition of def.conditions) {
        if (!condition(ctx)) {
          return { allowed: false, reason: 'A condition was not met' }
        }
      }
      return { allowed: true }
    },

    execute(ctx: AbilityContext): AbilityResult {
      const validation = this.validateActivation(ctx)
      if (!validation.allowed) {
        return { allowed: false, reason: validation.reason }
      }
      return {
        allowed: true,
        generatedEvents: (def.effects ?? []).map((e) => ({
          type: e().type,
          payload: e().payload ?? {},
        })),
      }
    },

    getAvailableInteractions(_ctx: AbilityContext): AbilityInteraction[] {
      return def.interactions ?? []
    },

    getPerspectiveEffects(_ctx: AbilityContext): PerspectiveModifier[] {
      return []
    },

    getUIComponent(): AbilityUIComponent {
      return def.ui ?? { componentKey: `${def.id}-ui` }
    },

    getInteractionManifest(): AbilityInteractionManifest | null {
      return def.interactionManifest ?? null
    },

    getActionWheel(_ctx: AbilityContext): NenActionWheelEntry[] {
      return def.actionWheel ?? []
    },

    explainAction(actionId: string, ctx: AbilityContext): ActionAvailability {
      const available = def.interactions?.some((i) => i.id === actionId) ?? false
      return {
        actionId,
        available,
        conditions: available
          ? [{ label: 'Action reconnue par la capacité', status: 'met' }]
          : [{ label: 'Action non disponible pour cette capacité', status: 'unmet' }],
      }
    },
  }
}
