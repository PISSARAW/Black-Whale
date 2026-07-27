import type { AbilityActivation } from '@black-whale/domain'
import type {
  EntityRef,
  ProposedWorldEvent,
  StoryCursor,
  WorldState,
} from '@black-whale/world-engine'

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
  projectedEffects: string[]
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
  | 'CLICK'
  | 'DRAG'
  | 'HOLD'
  | 'DRAW'
  | 'SEQUENCE'
  | 'TARGET_SELECTION'
  | 'CUSTOM'

/** What kinds of entities the ability can target */
export type NenAllowedTarget =
  | 'CHARACTER'
  | 'BODY'
  | 'OBJECT'
  | 'LOCATION'
  | 'AURA'
  | 'EVENT'

/** Visual overlays rendered on the map during the interaction */
export type NenOverlayType =
  | 'RANGE'
  | 'TRAJECTORY'
  | 'AURA'
  | 'TENSION'
  | 'FUTURE'
  | 'CONTROL_LINK'

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

  /** List all currently active abilities at a point in time */
  getActiveAbilities(eventId: string): Promise<AbilityActivation[]>

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

/** The six base Nen actions always considered for the wheel */
export const BASE_NEN_ACTIONS: NenActionWheelEntry[] = [
  { id: 'observe-aura', label: 'Observer l\'aura', abilityId: null, visibility: 'available' },
  { id: 'activate-en', label: 'Activer En', abilityId: null, visibility: 'available' },
  { id: 'use-ability', label: 'Utiliser capacité', abilityId: null, visibility: 'available' },
  { id: 'maintain-effect', label: 'Maintenir effet', abilityId: null, visibility: 'available' },
  { id: 'release-aura', label: 'Libérer aura', abilityId: null, visibility: 'available' },
  { id: 'cancel', label: 'Annuler', abilityId: null, visibility: 'available' },
]

// ──────────────────────────────────────────────
// Stub
// ──────────────────────────────────────────────

export class NenEngine implements INenEngine {
  private readonly modules = new Map<string, NenAbilityModule>()

  registerModule(module: NenAbilityModule): void {
    this.modules.set(module.manifest.id, module)
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
      reason: plan.status === 'AVAILABLE' ? undefined : `Ability action is ${plan.status.toLowerCase()}`,
      violatedRules: plan.conditions.filter((condition) => condition.status === 'UNMET').map((condition) => condition.id),
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

  async getActiveAbilities(_eventId: string): Promise<AbilityActivation[]> {
    // Return empty array for now since AbilityActivation is not stored in DB
    return []
  }

  async buildActionWheel(context: AbilityContext): Promise<NenActionWheelEntry[]> {
    let moduleActions: NenActionWheelEntry[] = []
    if (context.abilityId) {
      const module = this.modules.get(context.abilityId)
      if (module) {
        moduleActions = module.getActionWheel(context)
      }
    }
    return [...BASE_NEN_ACTIONS, ...moduleActions]
  }

  async explainAction(actionId: string, context: AbilityContext): Promise<ActionAvailability> {
    const module = this.modules.get(context.abilityId)
    if (module) {
      return module.explainAction(actionId, context)
    }
    // Fallback for base actions
    return {
      actionId,
      available: BASE_NEN_ACTIONS.some(a => a.id === actionId),
      conditions: [{ label: 'Action de base du Nen', status: 'met' }]
    }
  }
}
