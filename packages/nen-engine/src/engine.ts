import type { AbilityActivation, AbilityState } from '@black-whale/domain'
import type {
  EffectInstance,
  EffectKind,
  EntityRef,
  ProposedWorldEvent,
  StoryCursor,
  WorldEventType,
  WorldState,
} from '@black-whale/world-engine'
import type { AbilityArenaContract } from './arena.js'
import type { AbilitySitePresentation } from './site.js'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface AbilityContext {
  abilityId: string
  actorId: string
  targets: string[]
  eventId: string
  actionId?: string
  actor?: EntityRef
  targetRefs?: EntityRef[]
  anchors?: Array<{
    entity?: EntityRef
    locationId?: string
    point?: { x: number; y: number; coordinateSpace: string }
  }>
  cursor?: StoryCursor
  worldState?: WorldState
  parameters?: Record<string, unknown>
}

export type AbilityConditionStatus = 'MET' | 'UNMET' | 'UNKNOWN'

export interface AbilityConditionResult {
  id: string
  label: string
  status: AbilityConditionStatus
  reason?: string
}

export interface ValidationResult {
  allowed: boolean
  reason?: string
  violatedRules?: string[]
  conditions?: AbilityConditionResult[]
}

export interface AbilityResult {
  allowed: boolean
  activationId?: string
  generatedEvents?: Array<{
    type: string
    payload: Record<string, unknown>
  }>
  perspectiveTransition?: {
    fromBodyId: string
    toBodyId: string
  }
  reason?: string
  /** Authoritative world transitions. They are persisted only by a branch/canon application service. */
  events?: ProposedWorldEvent[]
}

/**
 * What an action would do if it were run, read off the effect builders
 * themselves rather than described in prose. The plan and the execution
 * therefore speak the same vocabulary: the world event that would be proposed,
 * and the entities it would land on.
 *
 * Not every ability creates an aura effect — Dowsing Chain grants knowledge,
 * Holy Chain changes a body state, Chrollo's portal moves someone — so the
 * projection is keyed on the event, with `kind` filled in only when one of
 * them is an effect.
 */
export interface ProjectedEffect {
  event: WorldEventType
  /** The effect created, when the event creates one. */
  kind?: EffectKind
  state?: EffectInstance['state']
  abilityId: string
  /** Entity ids the event would apply to, in the order the module names them. */
  targets: string[]
  /** In: real but invisible outside Gyo or omniscience. */
  masked?: boolean
  /** Keeps running once its user is dead (Bungee Gum, ch. 357). */
  postMortem?: boolean
}

export interface AbilityActionPlan {
  abilityId: string
  actionId: string
  status: 'AVAILABLE' | 'LOCKED' | 'UNKNOWN' | 'FORBIDDEN'
  conditions: AbilityConditionResult[]
  targetSchema: {
    allowedTargets: NenAllowedTarget[]
    minimum: number
    maximum?: number
  }
  interaction?: AbilityInteractionManifest
  projectedEffects: ProjectedEffect[]
  cost?: { label: string; amount?: number; unit?: string }
}

export interface AbilityInteraction {
  id: string
  label: string
  targetTypes: string[]
  conditions: string[]
}

export interface PerspectiveModifier {
  type: 'hide' | 'reveal' | 'distort' | 'replace'
  targetField: string
  value?: unknown
}

// ──────────────────────────────────────────────
// Interaction grammar — section 18 contract
// ──────────────────────────────────────────────

/** How the user physically interacts with the ability */
export type NenInteractionMode =
  'CLICK' | 'DRAG' | 'HOLD' | 'DRAW' | 'SEQUENCE' | 'TARGET_SELECTION' | 'CUSTOM'

/** What kinds of entities the ability can target */
export type NenAllowedTarget = 'CHARACTER' | 'BODY' | 'OBJECT' | 'LOCATION' | 'AURA' | 'EVENT'

/** Visual overlays rendered on the map during the interaction */
export type NenOverlayType = 'RANGE' | 'TRAJECTORY' | 'AURA' | 'TENSION' | 'FUTURE' | 'CONTROL_LINK'

/** Declares how the ability may change the tracked entity (section 11) */
export interface NenPerspectiveTransition {
  canChangeBody: boolean
  canChangeConsciousness: boolean
  canFollowAura: boolean
}

/**
 * Full interaction contract for a Nen ability.
 * Consumed by the frontend to render the correct input mode,
 * overlays and perspective options without reading a description.
 * (section 18)
 */
export interface AbilityInteractionManifest {
  abilityId: string

  /** Entry actions the user must trigger and required world-state predicates */
  entryPoints: {
    actions: string[]
    requiredState: string[]
  }

  /** Primary input gesture for this ability */
  inputMode: NenInteractionMode

  /** Entities that can be targeted */
  allowedTargets: NenAllowedTarget[]

  /** Map/canvas overlays to display during the interaction */
  overlays: NenOverlayType[]

  /** Perspective tracking options unlocked by this ability */
  perspectiveTransition?: NenPerspectiveTransition

  /**
   * Frontend component key for abilities that need a fully custom interface
   * (e.g. "BungeeGumInteraction", "BookOfRulesInteraction").
   */
  customComponent?: string
}

// ──────────────────────────────────────────────
// Universal interaction cycle (section 3)
// ──────────────────────────────────────────────

export type NenCycleStepId =
  | 'OBSERVE'
  | 'PREPARE_AURA'
  | 'SELECT_TARGET'
  | 'FILL_CONDITIONS'
  | 'ACTIVATE'
  | 'MAINTAIN'
  | 'PAY_COST'
  | 'SUFFER_CONSEQUENCES'

export type NenCycleStepStatus = 'pending' | 'current' | 'completed' | 'skipped' | 'blocked'

export interface NenCycleStep {
  id: NenCycleStepId
  label: string
  status: NenCycleStepStatus
  /** Human-readable note shown under the step (optional, context-dependent) */
  note?: string
}

// ──────────────────────────────────────────────
// Action wheel (section 4)
// ──────────────────────────────────────────────

/** Governs whether an action is shown and how */
export type ActionVisibility = 'available' | 'locked' | 'hidden' | 'unknown' | 'warning'

export interface NenActionWheelEntry {
  id: string
  label: string
  visibility: ActionVisibility
  /** Shown when visibility === 'locked' | 'warning' | 'unknown' */
  hint?: string
  /** The ability this action belongs to — null means a base Nen action */
  abilityId: string | null
}

// ──────────────────────────────────────────────
// "Why?" panel (section 14)
// ──────────────────────────────────────────────

export type ConditionStatus = 'met' | 'unmet' | 'unknown'

export interface WhyCondition {
  label: string
  status: ConditionStatus
}

export interface ActionAvailability {
  actionId: string
  available: boolean
  /** Conditions listed in the panel — respects perspective (may be unknown) */
  conditions: WhyCondition[]
  /**
   * Canonical (omniscient) reason when it differs from what the character knows.
   * Only populated in omniscient perspective.
   */
  canonicalReason?: string
}

// ──────────────────────────────────────────────
// Status header (section 2)
// ──────────────────────────────────────────────

export interface NenStatusHeader {
  chapterId: string
  narrativeTime?: string
  /** The character whose consciousness is being followed */
  followedConsciousnessId: string
  /** The physical body currently occupied by that consciousness */
  occupiedBodyId: string
  /** The perspective mode currently active */
  perspectiveMode: 'character' | 'omniscient' | 'body' | 'aura' | 'apparent'
  /** How other characters currently perceive the followed entity */
  perceivedAs: string
  /** Current Nen aura level 0–100 */
  auraLevel: number
}

// ──────────────────────────────────────────────
// Ability module contract
// ──────────────────────────────────────────────

export interface AbilityManifest {
  id: string
  name: string
  ownerId: string
  category: string
  version: string
  /**
   * How the ability shows itself on the site. Optional on the type so a module
   * written for the simulation alone stays valid; the compiler that generates
   * `hatsuProfiles.gen.ts` requires it of every ability the site casts, and
   * fails by name when one is missing.
   */
  site?: AbilitySitePresentation
  /**
   * What the ability costs and risks in a duel. Optional for the same reason
   * as `site`: most of the eighty-two are never cast in the arena. The ones
   * that are declare it here rather than in a table the arena keeps beside
   * them, which is what let a cost drift from the rule that charges it.
   */
  arena?: AbilityArenaContract
}

export interface AbilityUIComponent {
  /** Component identifier to dynamically import on the frontend */
  componentKey: string
  props?: Record<string, unknown>
}

export interface NenAbilityModule {
  manifest: AbilityManifest
  plan(context: AbilityContext): AbilityActionPlan
  validateActivation(context: AbilityContext): ValidationResult
  execute(context: AbilityContext): AbilityResult
  getAvailableInteractions(context: AbilityContext): AbilityInteraction[]
  getPerspectiveEffects(context: AbilityContext): PerspectiveModifier[]
  getUIComponent(): AbilityUIComponent
  /**
   * Return the full interaction contract for this ability (section 18).
   * Returns null if the ability has no dedicated interaction manifest.
   */
  getInteractionManifest(): AbilityInteractionManifest | null
  /**
   * Return the action wheel entries for this ability in the given context (section 4).
   * Visibility is filtered according to the actor's knowledge and state.
   */
  getActionWheel(context: AbilityContext): NenActionWheelEntry[]
  /**
   * Explain why a specific action is unavailable (section 14).
   * The returned conditions respect the current perspective:
   * unknown conditions may be hidden or labelled as unknown.
   */
  explainAction(actionId: string, context: AbilityContext): ActionAvailability
}

// ──────────────────────────────────────────────
// Engine interface
// ──────────────────────────────────────────────

export interface INenEngine {
  /** Build the authoritative interaction plan used by both UI and execution. */
  plan(context: AbilityContext): Promise<AbilityActionPlan>

  /** Validate whether an ability can be executed without actually running it */
  validate(context: AbilityContext): Promise<ValidationResult>

  /** Execute an ability and generate domain events */
  execute(context: AbilityContext): Promise<AbilityResult>

  /**
   * List the abilities still running in a world state. Activations are not
   * stored: they are derived from the effects the state carries, so a branch
   * and canon answer with the same rule.
   */
  getActiveAbilities(state: WorldState): Promise<AbilityActivation[]>

  /** Register a plugin module for a specific ability */
  registerModule(module: NenAbilityModule): void

  /**
   * Build the action wheel for a given actor in the current world state (section 4).
   * Merges base Nen actions with actions from all registered ability modules.
   */
  buildActionWheel(context: AbilityContext): Promise<NenActionWheelEntry[]>

  /**
   * Explain why a specific action is unavailable in the given context (section 14).
   */
  explainAction(actionId: string, context: AbilityContext): Promise<ActionAvailability>
}

// ──────────────────────────────────────────────
// Base Nen action wheel (section 4)
// ──────────────────────────────────────────────

/**
 * A base action and the world-state predicate that gates it. The predicates
 * duplicate no ability logic: they read the same three facts the SDK reads
 * (consciousness, owned abilities, live effects), which is all the Nen basics
 * depend on. The SDK cannot be imported here — it depends on this package.
 */
export interface BaseNenAction {
  id: string
  label: string
  /** What must hold for the action to be offered, and why when it does not. */
  requirement: string
  evaluate: (context: AbilityContext) => AbilityConditionStatus
}

function isConscious(context: AbilityContext): AbilityConditionStatus {
  const actor = context.worldState?.entities[context.actorId]
  if (!actor) return 'UNKNOWN'
  const state = String(actor.metadata?.['mentalState'] ?? actor.metadata?.['state'] ?? '')
  return state ? (state === 'ACTIVE' ? 'MET' : 'UNMET') : 'UNKNOWN'
}

function ownsAnAbility(context: AbilityContext): AbilityConditionStatus {
  if (!context.worldState) return 'UNKNOWN'
  return (context.worldState.abilitiesByOwner[context.actorId]?.length ?? 0) > 0 ? 'MET' : 'UNMET'
}

/** Effects the actor is the source of and that have not ended. */
function liveEffectsOf(context: AbilityContext): EffectInstance[] {
  if (!context.worldState) return []
  return Object.values(context.worldState.effects).filter(
    (effect) => effect.source.id === context.actorId && effect.state !== 'ENDED',
  )
}

function maintainsAnEffect(context: AbilityContext): AbilityConditionStatus {
  if (!context.worldState) return 'UNKNOWN'
  return liveEffectsOf(context).length > 0 ? 'MET' : 'UNMET'
}

/** Neither Nen nor a body is required to stop looking, or to change one's mind. */
const always = (): AbilityConditionStatus => 'MET'

/**
 * The six base Nen actions always considered for the wheel. They are
 * definitions, not verdicts: `evaluateBaseAction` decides per context.
 */
export const BASE_NEN_ACTIONS: BaseNenAction[] = [
  {
    id: 'observe-aura',
    label: "Observer l'aura",
    requirement: 'L’acteur est conscient',
    evaluate: isConscious,
  },
  {
    id: 'activate-en',
    label: 'Activer En',
    requirement: 'L’acteur est conscient et sait manier le Nen',
    evaluate: (context) => {
      const conscious = isConscious(context)
      if (conscious !== 'MET') return conscious
      return ownsAnAbility(context)
    },
  },
  {
    id: 'use-ability',
    label: 'Utiliser capacité',
    requirement: 'L’acteur possède au moins une capacité',
    evaluate: ownsAnAbility,
  },
  {
    id: 'maintain-effect',
    label: 'Maintenir effet',
    requirement: 'Un effet de l’acteur est encore en cours',
    evaluate: maintainsAnEffect,
  },
  {
    id: 'release-aura',
    label: 'Libérer aura',
    requirement: 'L’acteur est conscient',
    evaluate: isConscious,
  },
  { id: 'cancel', label: 'Annuler', requirement: 'Toujours disponible', evaluate: always },
]

const VISIBILITY_BY_STATUS: Record<AbilityConditionStatus, ActionVisibility> = {
  MET: 'available',
  UNMET: 'locked',
  UNKNOWN: 'unknown',
}

/** One base action turned into a wheel entry for the given context. */
export function evaluateBaseAction(
  action: BaseNenAction,
  context: AbilityContext,
): NenActionWheelEntry {
  const status = action.evaluate(context)
  return {
    id: action.id,
    label: action.label,
    abilityId: null,
    visibility: VISIBILITY_BY_STATUS[status],
    ...(status === 'MET' ? {} : { hint: action.requirement }),
  }
}

/**
 * Effect lifecycle → activation state. A dormant trap is still a running
 * ability, and one its user programmed before dying keeps its own state so the
 * timeline can say so rather than calling it merely "active".
 */
function activationState(effect: EffectInstance): AbilityState {
  if (effect.state === 'ENDED') return 'inactive'
  return effect.attributes['postMortem'] === true ? 'post_mortem' : 'active'
}

// ──────────────────────────────────────────────
// Engine
// ──────────────────────────────────────────────

export class NenEngine implements INenEngine {
  private readonly modules = new Map<string, NenAbilityModule>()

  registerModule(module: NenAbilityModule): void {
    this.modules.set(module.manifest.id, module)
  }

  /** Whether an ability can actually be planned and executed, not merely listed. */
  hasModule(abilityId: string): boolean {
    return this.modules.has(abilityId)
  }

  /**
   * The actions of one ability in one context — the wheel of a single module,
   * without the base Nen actions `buildActionWheel` merges in. A caller offering
   * "which action of this ability?" needs exactly this list.
   */
  abilityActionWheel(context: AbilityContext): NenActionWheelEntry[] {
    return this.modules.get(context.abilityId)?.getActionWheel(context) ?? []
  }

  async plan(context: AbilityContext): Promise<AbilityActionPlan> {
    const module = this.modules.get(context.abilityId)
    if (!module) {
      return {
        abilityId: context.abilityId,
        actionId: context.actionId ?? 'activate',
        status: 'FORBIDDEN',
        conditions: [{ id: 'module', label: 'Ability module registered', status: 'UNMET' }],
        targetSchema: { allowedTargets: [], minimum: 0 },
        projectedEffects: [],
      }
    }
    return module.plan(context)
  }

  async validate(context: AbilityContext): Promise<ValidationResult> {
    const plan = await this.plan(context)
    return {
      allowed: plan.status === 'AVAILABLE',
      reason:
        plan.status === 'AVAILABLE' ? undefined : `Ability action is ${plan.status.toLowerCase()}`,
      violatedRules: plan.conditions
        .filter((condition) => condition.status === 'UNMET')
        .map((condition) => condition.id),
      conditions: plan.conditions,
    }
  }

  async execute(context: AbilityContext): Promise<AbilityResult> {
    const module = this.modules.get(context.abilityId)
    if (!module) {
      return { allowed: false, reason: `Ability module not found: ${context.abilityId}` }
    }
    const validation = module.validateActivation(context)
    if (!validation.allowed) {
      return { allowed: false, reason: validation.reason }
    }
    return module.execute(context)
  }

  /**
   * Derived from the effects still standing in the state: one activation per
   * ability that owns at least one effect that has not ended. Nothing is read
   * from a table, so a simulated branch reports its abilities exactly like canon.
   */
  async getActiveAbilities(state: WorldState): Promise<AbilityActivation[]> {
    const byAbility = new Map<string, AbilityActivation>()

    for (const effect of Object.values(state.effects)) {
      if (effect.state === 'ENDED') continue
      const candidate: AbilityActivation = {
        id: `${effect.abilityId}:${effect.source.id}`,
        abilityId: effect.abilityId,
        actorId: effect.source.id,
        startedAtEventId: effect.startedAt.eventId,
        state: activationState(effect),
        ...(effect.endedAt ? { endedAtEventId: effect.endedAt.eventId } : {}),
      }
      const existing = byAbility.get(candidate.id)
      // Several effects can belong to one activation; the post-mortem one wins,
      // because it is the fact the reader came for.
      if (!existing || (existing.state !== 'post_mortem' && candidate.state === 'post_mortem')) {
        byAbility.set(candidate.id, candidate)
      }
    }

    return [...byAbility.values()]
  }

  /**
   * The wheel of an actor, not of one ability: every module the actor owns
   * contributes its entries, each evaluated against a context carrying its own
   * ability id. Kurapika's five fingers and Chrollo's stolen book are one wheel.
   */
  async buildActionWheel(context: AbilityContext): Promise<NenActionWheelEntry[]> {
    const base = BASE_NEN_ACTIONS.map((action) => evaluateBaseAction(action, context))

    const owned = context.worldState?.abilitiesByOwner[context.actorId] ?? []
    const abilityIds = [...new Set([...owned, ...(context.abilityId ? [context.abilityId] : [])])]

    const moduleActions = abilityIds.flatMap((abilityId) => {
      const module = this.modules.get(abilityId)
      if (!module) return []
      return module.getActionWheel({ ...context, abilityId })
    })

    return [...base, ...moduleActions]
  }

  async explainAction(actionId: string, context: AbilityContext): Promise<ActionAvailability> {
    const module = this.modules.get(context.abilityId)
    if (module) {
      return module.explainAction(actionId, context)
    }

    const base = BASE_NEN_ACTIONS.find((action) => action.id === actionId)
    if (!base) {
      return {
        actionId,
        available: false,
        conditions: [{ label: 'Action inconnue du moteur', status: 'unmet' }],
      }
    }

    // A base action explains itself with the predicate that gates it, so the
    // "Why?" panel never falls back to "because it is a base action".
    const status = base.evaluate(context)
    return {
      actionId,
      available: status === 'MET',
      conditions: [
        {
          label: base.requirement,
          status: status === 'MET' ? 'met' : status === 'UNMET' ? 'unmet' : 'unknown',
        },
      ],
    }
  }
}
