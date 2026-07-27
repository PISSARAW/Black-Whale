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
import type {
  EffectInstance,
  EntityRef,
  ProposedWorldEvent,
  StoryCursor,
} from '@black-whale/world-engine'
import type { AbilityConditionResult, AbilityActionPlan } from '@black-whale/nen-engine'

// ──────────────────────────────────────────────
// Condition builders
// ──────────────────────────────────────────────

export type ConditionFn = (ctx: AbilityContext) => AbilityConditionResult

const condition = (
  id: string,
  label: string,
  evaluate: (ctx: AbilityContext) => AbilityConditionResult['status'],
  reason?: string,
): ConditionFn => (ctx) => ({ id, label, status: evaluate(ctx), reason })

export const canUseNen = (): ConditionFn => condition(
  'can-use-nen',
  'Actor can use Nen',
  (ctx) => {
    if (!ctx.worldState) return 'UNKNOWN'
    const abilities = ctx.worldState.abilitiesByOwner[ctx.actorId]
    return abilities?.includes(ctx.abilityId) ? 'MET' : 'UNMET'
  },
)

export const isConscious = (): ConditionFn => condition(
  'is-conscious',
  'Actor is conscious',
  (ctx) => {
    if (!ctx.worldState) return 'UNKNOWN'
    const actor = ctx.worldState.entities[ctx.actorId]
    if (!actor) return 'UNKNOWN'
    const state = String(actor.metadata?.mentalState ?? actor.metadata?.state ?? '')
    return state ? (state === 'ACTIVE' ? 'MET' : 'UNMET') : 'UNKNOWN'
  },
)

export const isAlive = (): ConditionFn => condition(
  'is-alive',
  'Actor body is alive',
  (ctx) => {
    if (!ctx.worldState) return 'UNKNOWN'
    const state = ctx.worldState.bodyStates[ctx.actorId]
    return state ? (state === 'ALIVE' || state === 'INJURED' ? 'MET' : 'UNMET') : 'UNKNOWN'
  },
)

export const maxDistance = (meters: number): ConditionFn => condition(
  `max-distance-${meters}`,
  `Targets are within ${meters} metres`,
  (ctx) => typeof ctx.parameters?.distanceMeters === 'number'
    ? (ctx.parameters.distanceMeters <= meters ? 'MET' : 'UNMET')
    : 'UNKNOWN',
)

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

export type EffectBuilder = (ctx: AbilityContext) => ProposedWorldEvent[]

function fallbackCursor(ctx: AbilityContext): StoryCursor {
  return ctx.cursor ?? {
    branchId: 'preview', ordinal: 0, eventId: ctx.eventId, chapterNumber: 0, localSequence: 0,
  }
}

function refs(ctx: AbilityContext): EntityRef[] {
  return ctx.targetRefs ?? ctx.targets.map((id) => ({ id, kind: 'OBJECT' as const }))
}

function effectEvent(ctx: AbilityContext, kind: EffectInstance['kind'], attributes: Record<string, unknown> = {}): ProposedWorldEvent[] {
  const cursor = fallbackCursor(ctx)
  const source = ctx.actor ?? { id: ctx.actorId, kind: 'CHARACTER' as const }
  const targets = refs(ctx)
  const effect: EffectInstance = {
    id: `${ctx.abilityId}:${ctx.actorId}:${ctx.eventId}:${kind.toLowerCase()}`,
    kind,
    abilityId: ctx.abilityId,
    source,
    targets,
    anchors: ctx.anchors ?? [{ entity: source }, ...targets.map((entity) => ({ entity }))],
    state: 'ACTIVE',
    attributes,
    startedAt: cursor,
  }
  return [{ type: 'EFFECT_CREATED', payload: { effect } }]
}

export const elasticConnection = (): EffectBuilder => (ctx) => effectEvent(ctx, 'ELASTIC_BINDING', { retractable: true, adhesive: true })
export const adhesiveConnection = (): EffectBuilder => (ctx) => effectEvent(ctx, 'ADHESIVE_BINDING', { adhesive: true })
export const transferConsciousness = (): EffectBuilder => (ctx) => {
  const consciousnessId = String(ctx.parameters?.consciousnessId ?? ctx.actorId)
  const fromBodyId = typeof ctx.parameters?.fromBodyId === 'string' ? ctx.parameters.fromBodyId : undefined
  const toBodyId = ctx.targetRefs?.[0]?.id ?? ctx.targets[0]
  return toBodyId ? [{ type: 'CONSCIOUSNESS_TRANSFERRED', payload: { consciousnessId, fromBodyId, toBodyId } }] : []
}
export const teleport = (): EffectBuilder => (ctx) => {
  const entity = ctx.targetRefs?.[0] ?? (ctx.targets[0] ? { id: ctx.targets[0], kind: 'OBJECT' as const } : undefined)
  const locationId = typeof ctx.parameters?.locationId === 'string' ? ctx.parameters.locationId : undefined
  return entity && locationId ? [{ type: 'ENTITY_MOVED', payload: { presence: { entity, locationId, precision: 'EXACT_ROOM', certainty: 'CONFIRMED' } } }] : []
}
export const detectAura = (): EffectBuilder => (ctx) => effectEvent(ctx, 'AURA_MODIFIER', { mode: 'DETECTION' })

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

    plan(ctx: AbilityContext): AbilityActionPlan {
      const conditions = (def.conditions ?? []).map((predicate) => predicate(ctx))
      const hasUnmet = conditions.some((result) => result.status === 'UNMET')
      const hasUnknown = conditions.some((result) => result.status === 'UNKNOWN')
      const interaction = def.interactionManifest
      return {
        abilityId: def.id,
        actionId: ctx.actionId ?? 'activate',
        status: hasUnmet ? 'LOCKED' : hasUnknown ? 'UNKNOWN' : 'AVAILABLE',
        conditions,
        targetSchema: {
          allowedTargets: interaction?.allowedTargets ?? [],
          minimum: interaction?.allowedTargets.length ? 1 : 0,
        },
        interaction,
        projectedEffects: (def.effects ?? []).map((_, index) => `effect:${index}`),
      }
    },

    validateActivation(ctx: AbilityContext): ValidationResult {
      const plan = this.plan(ctx)
      return {
        allowed: plan.status === 'AVAILABLE',
        reason: plan.status === 'AVAILABLE' ? undefined : `Ability conditions are ${plan.status.toLowerCase()}`,
        conditions: plan.conditions,
        violatedRules: plan.conditions.filter((result) => result.status === 'UNMET').map((result) => result.id),
      }
    },

    execute(ctx: AbilityContext): AbilityResult {
      const validation = this.validateActivation(ctx)
      if (!validation.allowed) {
        return { allowed: false, reason: validation.reason }
      }
      const events = (def.effects ?? []).flatMap((effect) => effect(ctx))
      return {
        allowed: true,
        events,
        generatedEvents: events.map((event) => ({ type: event.type, payload: event.payload as Record<string, unknown> })),
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

    explainAction(actionId: string, _ctx: AbilityContext): ActionAvailability {
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
