import type {
  AbilityActionPlan,
  AbilityArenaContract,
  AbilityContext,
  AbilityInteraction,
  AbilityInteractionManifest,
  AbilityManifest,
  AbilityResult,
  AbilitySitePresentation,
  AbilityUIComponent,
  ActionAvailability,
  NenAbilityModule,
  NenActionWheelEntry,
  PerspectiveModifier,
  ProjectedEffect,
  ValidationResult,
  WhyCondition,
} from '@black-whale/nen-engine'
import { proposedSubjectIds, type ProposedWorldEvent } from '@black-whale/world-engine'
import type { ConditionFn } from './conditions.js'
import { resolve, type Resolvable } from './context.js'
import type { EffectBuilder } from './effects.js'
import type { TargetType } from './interactions.js'

/** The price the ability charges, surfaced by the plan and the "Why?" panel. */
export type AbilityCost = { label: string; amount?: number; unit?: string }

/**
 * One entry of the action wheel with its own rules. Abilities whose fingers,
 * phases or doors behave differently (the Kurapika chains, Magical Worm's open
 * and close) declare one action each instead of a single undifferentiated effect.
 */
export interface AbilityAction {
  label: string
  /** Added to the ability-wide conditions when this action is the one being run. */
  conditions?: ConditionFn[]
  /**
   * Shown in the "Why?" panel but never blocking: what the manga leaves unsaid
   * about an action that nonetheless happens (who Grimmel's arrow picks).
   */
  notes?: ConditionFn[]
  effects?: EffectBuilder[]
  cost?: Resolvable<AbilityCost | undefined>
  targetTypes?: TargetType[]
  hint?: string
  /** Kept off the wheel until the world state makes it reachable. */
  locked?: boolean
}

export interface AbilityDefinition {
  id: string
  owner: string
  /** Display name; defaults to the id so existing modules keep working. */
  name?: string
  category?: string
  conditions?: ConditionFn[]
  /** Non-blocking canon caveats, listed alongside the conditions. */
  notes?: ConditionFn[]
  targets?: TargetType[]
  interactions?: AbilityInteraction[]
  effects?: EffectBuilder[]
  actions?: Record<string, AbilityAction>
  cost?: Resolvable<AbilityCost | undefined>
  perspective?: (ctx: AbilityContext) => PerspectiveModifier[]
  ui?: AbilityUIComponent
  /**
   * How the site presents the ability: its interaction kind, the sentence that
   * states the limit, its price, its colour and its first action. Read by the
   * compiler that generates the web registry — see `AbilitySitePresentation`.
   */
  site?: AbilitySitePresentation
  /**
   * What the ability costs and risks when the arena casts it. Declared beside
   * the rule it charges for, rather than in the duel's own table — see
   * `AbilityArenaContract`.
   */
  arena?: AbilityArenaContract
  /** Full interaction contract (section 18) */
  interactionManifest?: AbilityInteractionManifest
  /** Static action wheel entries for this ability */
  actionWheel?: NenActionWheelEntry[]
}

function toWhyCondition(result: {
  label: string
  status: 'MET' | 'UNMET' | 'UNKNOWN'
}): WhyCondition {
  return {
    label: result.label,
    status: result.status === 'MET' ? 'met' : result.status === 'UNMET' ? 'unmet' : 'unknown',
  }
}

export function defineAbility(def: AbilityDefinition): NenAbilityModule {
  const manifest: AbilityManifest = {
    id: def.id,
    name: def.name ?? def.id,
    ownerId: def.owner,
    category: def.category ?? 'unknown',
    version: '0.0.1',
    ...(def.site ? { site: def.site } : {}),
    ...(def.arena ? { arena: def.arena } : {}),
  }

  const actionOf = (ctx: AbilityContext): AbilityAction | undefined =>
    ctx.actionId ? def.actions?.[ctx.actionId] : undefined

  const conditionsOf = (ctx: AbilityContext) =>
    [...(def.conditions ?? []), ...(actionOf(ctx)?.conditions ?? [])].map((predicate) =>
      predicate(ctx),
    )

  const notesOf = (ctx: AbilityContext) =>
    [...(def.notes ?? []), ...(actionOf(ctx)?.notes ?? [])].map((predicate) => predicate(ctx))

  const effectsOf = (ctx: AbilityContext): EffectBuilder[] =>
    actionOf(ctx)?.effects ?? def.effects ?? []

  /**
   * What the action would create, obtained by running the effect builders
   * themselves. They are pure functions of the context — nothing is persisted
   * until an application service accepts the events — so the projection and the
   * execution can never describe two different things.
   */
  const projectionOf = (ctx: AbilityContext): ProjectedEffect[] =>
    effectsOf(ctx).flatMap((builder) => {
      let events: ProposedWorldEvent[]
      try {
        events = builder(ctx)
      } catch {
        // A builder that needs a parameter the caller has not supplied yet
        // cannot be projected. Guessing here would put a fiction in the panel.
        return []
      }
      return events.map((event) => {
        const base = {
          event: event.type,
          abilityId: ctx.abilityId,
          targets: proposedSubjectIds(event),
        }
        if (event.type !== 'EFFECT_CREATED') return base
        const effect = event.payload.effect
        return {
          ...base,
          kind: effect.kind,
          state: effect.state,
          abilityId: effect.abilityId,
          targets: effect.targets.map((target) => target.id),
          ...(effect.attributes['masked'] === true ? { masked: true } : {}),
          ...(effect.attributes['postMortem'] === true ? { postMortem: true } : {}),
        }
      })
    })

  const costOf = (ctx: AbilityContext): AbilityCost | undefined => {
    const action = actionOf(ctx)
    const own = action?.cost === undefined ? undefined : resolve(action.cost, ctx)
    return own ?? (def.cost === undefined ? undefined : resolve(def.cost, ctx))
  }

  const derivedWheel = (): NenActionWheelEntry[] => {
    const fromActions = Object.entries(def.actions ?? {}).map(([id, action]) => ({
      id,
      label: action.label,
      abilityId: def.id,
      visibility: action.locked ? ('locked' as const) : ('available' as const),
      hint: action.hint,
    }))
    if (fromActions.length > 0) return fromActions
    // An ability with a single undifferentiated effect still needs somewhere to
    // be clicked, so it offers a plain activation.
    return [
      {
        id: 'activate',
        label: def.name ?? def.id,
        abilityId: def.id,
        visibility: 'available' as const,
      },
    ]
  }

  return {
    manifest,

    plan(ctx: AbilityContext): AbilityActionPlan {
      const conditions = conditionsOf(ctx)
      const hasUnmet = conditions.some((result) => result.status === 'UNMET')
      const hasUnknown = conditions.some((result) => result.status === 'UNKNOWN')
      const interaction = def.interactionManifest
      const cost = costOf(ctx)
      return {
        abilityId: def.id,
        actionId: ctx.actionId ?? 'activate',
        status: hasUnmet ? 'LOCKED' : hasUnknown ? 'UNKNOWN' : 'AVAILABLE',
        // Notes ride along so the panel can show them, but they never gate.
        conditions: [...conditions, ...notesOf(ctx)],
        targetSchema: {
          allowedTargets: interaction?.allowedTargets ?? [],
          minimum: interaction?.allowedTargets.length ? 1 : 0,
        },
        interaction,
        projectedEffects: projectionOf(ctx),
        ...(cost ? { cost } : {}),
      }
    },

    validateActivation(ctx: AbilityContext): ValidationResult {
      const plan = this.plan(ctx)
      return {
        allowed: plan.status === 'AVAILABLE',
        reason:
          plan.status === 'AVAILABLE'
            ? undefined
            : `Ability conditions are ${plan.status.toLowerCase()}`,
        conditions: plan.conditions,
        violatedRules: plan.conditions
          .filter((result) => result.status === 'UNMET')
          .map((result) => result.id),
      }
    },

    execute(ctx: AbilityContext): AbilityResult {
      const validation = this.validateActivation(ctx)
      if (!validation.allowed) {
        return { allowed: false, reason: validation.reason }
      }
      const events = effectsOf(ctx).flatMap((effect) => effect(ctx))
      return {
        allowed: true,
        events,
        generatedEvents: events.map((event) => ({
          type: event.type,
          payload: event.payload as Record<string, unknown>,
        })),
      }
    },

    getAvailableInteractions(_ctx: AbilityContext): AbilityInteraction[] {
      const declared = def.interactions ?? []
      if (declared.length > 0) return declared
      return Object.entries(def.actions ?? {}).map(([id, action]) => ({
        id,
        label: action.label,
        targetTypes: action.targetTypes ?? def.targets ?? [],
        conditions: [],
      }))
    },

    getPerspectiveEffects(ctx: AbilityContext): PerspectiveModifier[] {
      return def.perspective?.(ctx) ?? []
    },

    getUIComponent(): AbilityUIComponent {
      return def.ui ?? { componentKey: `${def.id}-ui` }
    },

    getInteractionManifest(): AbilityInteractionManifest | null {
      return def.interactionManifest ?? null
    },

    getActionWheel(_ctx: AbilityContext): NenActionWheelEntry[] {
      return def.actionWheel ?? derivedWheel()
    },

    explainAction(actionId: string, ctx: AbilityContext): ActionAvailability {
      const action = def.actions?.[actionId]
      if (action) {
        const results = [...(def.conditions ?? []), ...(action.conditions ?? [])].map((predicate) =>
          predicate(ctx),
        )
        const notes = [...(def.notes ?? []), ...(action.notes ?? [])].map((predicate) =>
          predicate(ctx),
        )
        return {
          actionId,
          available: results.every((result) => result.status === 'MET'),
          conditions: [...results, ...notes].map(toWhyCondition),
        }
      }

      const available = def.interactions?.some((entry) => entry.id === actionId) ?? false
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
