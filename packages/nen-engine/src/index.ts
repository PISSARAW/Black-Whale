import type { NenAbility, AbilityActivation, NenEffect } from '@black-whale/domain'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface AbilityContext {
  abilityId: string
  actorId: string
  targets: string[]
  eventId: string
  worldState?: Record<string, unknown>
}

export interface ValidationResult {
  allowed: boolean
  reason?: string
  violatedRules?: string[]
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
  validateActivation(context: AbilityContext): ValidationResult
  execute(context: AbilityContext): AbilityResult
  getAvailableInteractions(context: AbilityContext): AbilityInteraction[]
  getPerspectiveEffects(context: AbilityContext): PerspectiveModifier[]
  getUIComponent(): AbilityUIComponent
}

// ──────────────────────────────────────────────
// Engine interface
// ──────────────────────────────────────────────

export interface INenEngine {
  /** Validate whether an ability can be executed without actually running it */
  validate(context: AbilityContext): Promise<ValidationResult>

  /** Execute an ability and generate domain events */
  execute(context: AbilityContext): Promise<AbilityResult>

  /** List all currently active abilities at a point in time */
  getActiveAbilities(eventId: string): Promise<AbilityActivation[]>

  /** Register a plugin module for a specific ability */
  registerModule(module: NenAbilityModule): void
}

// ──────────────────────────────────────────────
// Stub
// ──────────────────────────────────────────────

export class NenEngine implements INenEngine {
  private readonly modules = new Map<string, NenAbilityModule>()

  registerModule(module: NenAbilityModule): void {
    this.modules.set(module.manifest.id, module)
  }

  async validate(context: AbilityContext): Promise<ValidationResult> {
    throw new Error(`NenEngine.validate not implemented — abilityId: ${context.abilityId}`)
  }

  async execute(context: AbilityContext): Promise<AbilityResult> {
    throw new Error(`NenEngine.execute not implemented — abilityId: ${context.abilityId}`)
  }

  async getActiveAbilities(eventId: string): Promise<AbilityActivation[]> {
    throw new Error(`NenEngine.getActiveAbilities not implemented — eventId: ${eventId}`)
  }
}
