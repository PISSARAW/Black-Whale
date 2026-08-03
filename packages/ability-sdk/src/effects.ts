import type { AbilityContext } from '@black-whale/nen-engine'
import type {
  EffectAnchor,
  EffectInstance,
  EffectKind,
  EntityRef,
  KnowledgeRecord,
  PresenceCertainty,
  PresencePrecision,
  ProposedWorldEvent,
  WorldEntityKind,
} from '@black-whale/canon-engine'
import {
  actorRef,
  effectId,
  fallbackCursor,
  param,
  resolve,
  targetRefs,
  type Resolvable,
} from './context.js'

export type EffectBuilder = (ctx: AbilityContext) => ProposedWorldEvent[]

export interface EffectOptions {
  kind: EffectKind
  /** Distinguishes several effects emitted by the same activation. */
  discriminator?: string
  attributes?: Resolvable<Record<string, unknown>>
  state?: EffectInstance['state']
  source?: Resolvable<EntityRef>
  targets?: Resolvable<EntityRef[]>
  anchors?: Resolvable<EffectAnchor[]>
}

/** The generic effect emitter every named builder below delegates to. */
export const effect =
  (options: EffectOptions): EffectBuilder =>
  (ctx) => {
    const cursor = fallbackCursor(ctx)
    const source = options.source ? resolve(options.source, ctx) : actorRef(ctx)
    const targets = options.targets ? resolve(options.targets, ctx) : targetRefs(ctx)
    const instance: EffectInstance = {
      id: effectId(ctx, options.discriminator ?? options.kind),
      kind: options.kind,
      abilityId: ctx.abilityId,
      source,
      targets,
      anchors: options.anchors
        ? resolve(options.anchors, ctx)
        : (ctx.anchors ?? [{ entity: source }, ...targets.map((entity) => ({ entity }))]),
      state: options.state ?? 'ACTIVE',
      attributes: options.attributes ? resolve(options.attributes, ctx) : {},
      startedAt: cursor,
    }
    return [{ type: 'EFFECT_CREATED', payload: { effect: instance } }]
  }

// ──────────────────────────────────────────────
// Decorators
// ──────────────────────────────────────────────

function decorateEffects(
  events: ProposedWorldEvent[],
  attributes: Record<string, unknown>,
): ProposedWorldEvent[] {
  return events.map((event) =>
    event.type === 'EFFECT_CREATED'
      ? {
          ...event,
          payload: {
            effect: {
              ...event.payload.effect,
              attributes: { ...event.payload.effect.attributes, ...attributes },
            },
          },
        }
      : event,
  )
}

/**
 * "Nen grows stronger after death": marks the effects a builder creates as
 * surviving their source's death. The world-engine reducer enforces the rest.
 */
export const postMortem =
  (builder: EffectBuilder): EffectBuilder =>
  (ctx) =>
    decorateEffects(builder(ctx), { postMortem: true })

/**
 * In: the effect is real but invisible in every perspective except omniscient
 * or an observer using Gyo.
 */
export const masked =
  (builder: EffectBuilder, awareObserverIds: string[] = []): EffectBuilder =>
  (ctx) =>
    decorateEffects(builder(ctx), {
      masked: true,
      ...(awareObserverIds.length ? { awareObserverIds } : {}),
    })

/** Creates the effect dormant: a trap armed, waiting for its canonical trigger. */
export const dormant =
  (builder: EffectBuilder): EffectBuilder =>
  (ctx) =>
    builder(ctx).map((event) =>
      event.type === 'EFFECT_CREATED'
        ? { ...event, payload: { effect: { ...event.payload.effect, state: 'DORMANT' as const } } }
        : event,
    )

/** Attaches the chapters an activation is drawn from, so the UI can cite them. */
export const sourcedFrom =
  (builder: EffectBuilder, sourceIds: string[]): EffectBuilder =>
  (ctx) =>
    builder(ctx).map((event) => ({ ...event, sourceIds }))

/** Hides an activation from readers who have not reached the reveal chapter. */
export const revealedAt =
  (builder: EffectBuilder, chapterNumber: number): EffectBuilder =>
  (ctx) =>
    builder(ctx).map((event) => ({ ...event, revealedAtChapter: chapterNumber }))

export const combine =
  (...builders: EffectBuilder[]): EffectBuilder =>
  (ctx) =>
    builders.flatMap((builder) => builder(ctx))

// ──────────────────────────────────────────────
// Bindings and constraints
// ──────────────────────────────────────────────

export const elasticConnection = (): EffectBuilder =>
  effect({ kind: 'ELASTIC_BINDING', attributes: { retractable: true, adhesive: true } })

export const adhesiveConnection = (): EffectBuilder =>
  effect({ kind: 'ADHESIVE_BINDING', attributes: { adhesive: true } })

export interface ConstraintOptions {
  /** The rules, verbatim: the manga always states them, so the UI shows them. */
  rules?: string[]
  attributes?: Resolvable<Record<string, unknown>>
  dormant?: boolean
}

export const constraint = (options: ConstraintOptions = {}): EffectBuilder => {
  const builder = effect({
    kind: 'CONSTRAINT',
    attributes: (ctx) => ({
      rules: options.rules ?? [],
      ...(options.attributes ? resolve(options.attributes, ctx) : {}),
    }),
  })
  return options.dormant ? dormant(builder) : builder
}

export interface CurseOptions {
  rules?: string[]
  trigger?: string
  attributes?: Resolvable<Record<string, unknown>>
  /** Curses are dormant by default: they wait for the condition to be violated. */
  active?: boolean
}

export const curse = (options: CurseOptions = {}): EffectBuilder => {
  const builder = effect({
    kind: 'CURSE',
    attributes: (ctx) => ({
      rules: options.rules ?? [],
      ...(options.trigger ? { trigger: options.trigger } : {}),
      ...(options.attributes ? resolve(options.attributes, ctx) : {}),
    }),
  })
  return options.active ? builder : dormant(builder)
}

export const auraModifier = (attributes: Record<string, unknown> = {}): EffectBuilder =>
  effect({ kind: 'AURA_MODIFIER', attributes })

export const detectAura = (): EffectBuilder => auraModifier({ mode: 'DETECTION' })

// ──────────────────────────────────────────────
// Perception and control
// ──────────────────────────────────────────────

export interface PerceptionMaskOptions {
  /** The entity id the target is perceived as. */
  appearsAs?: Resolvable<string | undefined>
  /** Observers the mask does not fool (Fugetsu sees Kacho for what she is). */
  awareObserverIds?: string[]
  /** Texture Surprise fails on touch; In does not. */
  tactileFail?: boolean
  auraDetectable?: boolean
  attributes?: Resolvable<Record<string, unknown>>
}

export const perceptionMask = (options: PerceptionMaskOptions = {}): EffectBuilder =>
  effect({
    kind: 'PERCEPTION_MASK',
    attributes: (ctx) => {
      const appearsAs = options.appearsAs
        ? resolve(options.appearsAs, ctx)
        : param(ctx, 'appearsAs')
      return {
        ...(appearsAs ? { appearsAs } : {}),
        ...(options.awareObserverIds?.length ? { awareObserverIds: options.awareObserverIds } : {}),
        ...(options.tactileFail === undefined ? {} : { tactileFail: options.tactileFail }),
        ...(options.auraDetectable === undefined ? {} : { auraDetectable: options.auraDetectable }),
        ...(options.attributes ? resolve(options.attributes, ctx) : {}),
      }
    },
  })

export interface ControlLinkOptions {
  /** How the link was established: needle, antenna, thread, spore, aura sphere. */
  vector?: string
  /** `control` hands the target's actions to the source; `listen` only observes. */
  mode?: 'control' | 'listen' | 'observe'
  attributes?: Resolvable<Record<string, unknown>>
  targets?: Resolvable<EntityRef[]>
}

export const controlLink = (options: ControlLinkOptions = {}): EffectBuilder =>
  effect({
    kind: 'CONTROL_LINK',
    targets: options.targets,
    attributes: (ctx) => ({
      ...(options.vector ? { vector: options.vector } : {}),
      mode: options.mode ?? 'control',
      ...(options.attributes ? resolve(options.attributes, ctx) : {}),
    }),
  })

// ──────────────────────────────────────────────
// Space
// ──────────────────────────────────────────────

export interface PortalOptions {
  /** Defaults to the actor's `fromLocationId` / `locationId` parameters. */
  fromLocationId?: Resolvable<string | undefined>
  toLocationId?: Resolvable<string | undefined>
  discriminator?: string
  attributes?: Resolvable<Record<string, unknown>>
}

/** A one-way passage between two locations, drawn on the map as a dotted route. */
export const portal = (options: PortalOptions = {}): EffectBuilder =>
  effect({
    kind: 'PORTAL',
    discriminator: options.discriminator ?? 'portal',
    anchors: (ctx) => {
      const from = options.fromLocationId
        ? resolve(options.fromLocationId, ctx)
        : param(ctx, 'fromLocationId')
      const to = options.toLocationId
        ? resolve(options.toLocationId, ctx)
        : param(ctx, 'locationId')
      return [
        ...(from ? [{ locationId: from }] : []),
        ...(to ? [{ locationId: to }] : []),
      ] satisfies EffectAnchor[]
    },
    attributes: (ctx) => ({
      fromLocationId: options.fromLocationId
        ? resolve(options.fromLocationId, ctx)
        : param(ctx, 'fromLocationId'),
      toLocationId: options.toLocationId
        ? resolve(options.toLocationId, ctx)
        : param(ctx, 'locationId'),
      ...(options.attributes ? resolve(options.attributes, ctx) : {}),
    }),
  })

export interface MoveOptions {
  entity?: Resolvable<EntityRef | undefined>
  locationId?: Resolvable<string | undefined>
  precision?: PresencePrecision
  certainty?: PresenceCertainty
  probability?: number
}

export const moveEntity =
  (options: MoveOptions = {}): EffectBuilder =>
  (ctx) => {
    const entity = options.entity
      ? resolve(options.entity, ctx)
      : (targetRefs(ctx)[0] ?? actorRef(ctx))
    const locationId = options.locationId
      ? resolve(options.locationId, ctx)
      : param(ctx, 'locationId')
    if (!entity || !locationId) return []
    return [
      {
        type: 'ENTITY_MOVED',
        payload: {
          presence: {
            entity,
            locationId,
            precision: options.precision ?? 'EXACT_ROOM',
            certainty: options.certainty ?? 'CONFIRMED',
            observedAtEventId: ctx.eventId,
            ...(options.probability === undefined ? {} : { probability: options.probability }),
          },
        },
      },
    ]
  }

/** Kept for the original SDK surface: a teleport is a move with no path. */
export const teleport = (): EffectBuilder => (ctx) => {
  const entity =
    ctx.targetRefs?.[0] ??
    (ctx.targets[0] ? { id: ctx.targets[0], kind: 'OBJECT' as const } : undefined)
  const locationId = param(ctx, 'locationId')
  return entity && locationId
    ? [
        {
          type: 'ENTITY_MOVED',
          payload: {
            presence: { entity, locationId, precision: 'EXACT_ROOM', certainty: 'CONFIRMED' },
          },
        },
      ]
    : []
}

// ──────────────────────────────────────────────
// Entities
// ──────────────────────────────────────────────

export interface SpawnOptions {
  id: Resolvable<string>
  label: Resolvable<string>
  kind?: WorldEntityKind
  metadata?: Resolvable<Record<string, unknown>>
  originalCharacterId?: string
}

/** Registers the Nen beast, cohort, portal or construct an ability brings into being. */
export const spawnNenEntity =
  (options: SpawnOptions): EffectBuilder =>
  (ctx) => [
    {
      type: 'ENTITY_REGISTERED',
      payload: {
        entity: {
          id: resolve(options.id, ctx),
          kind: options.kind ?? 'NEN_ENTITY',
          label: resolve(options.label, ctx),
          ...(options.originalCharacterId
            ? { originalCharacterId: options.originalCharacterId }
            : {}),
          ...(options.metadata ? { metadata: resolve(options.metadata, ctx) } : {}),
        },
      },
    },
  ]

// ──────────────────────────────────────────────
// Bodies and consciousnesses
// ──────────────────────────────────────────────

export interface BodyStateOptions {
  bodyId?: Resolvable<string | undefined>
  state: Resolvable<string>
}

export const bodyState =
  (options: BodyStateOptions): EffectBuilder =>
  (ctx) => {
    const bodyId = options.bodyId
      ? resolve(options.bodyId, ctx)
      : (param(ctx, 'bodyId') ?? targetRefs(ctx)[0]?.id)
    return bodyId
      ? [{ type: 'BODY_STATE_CHANGED', payload: { bodyId, state: resolve(options.state, ctx) } }]
      : []
  }

export const transferConsciousness = (): EffectBuilder => (ctx) => {
  const consciousnessId = String(ctx.parameters?.['consciousnessId'] ?? ctx.actorId)
  const fromBodyId = param(ctx, 'fromBodyId')
  const toBodyId = ctx.targetRefs?.[0]?.id ?? ctx.targets[0]
  return toBodyId
    ? [{ type: 'CONSCIOUSNESS_TRANSFERRED', payload: { consciousnessId, fromBodyId, toBodyId } }]
    : []
}

/**
 * Grimmel's arrow: two consciousnesses change bodies in one indivisible step.
 * Emitting them separately would leave a frame where a body holds nobody.
 */
export const soulSwap =
  (): EffectBuilder =>
  (ctx): ProposedWorldEvent[] => {
    const firstConsciousness = param(ctx, 'consciousnessId')
    const firstBody = param(ctx, 'fromBodyId')
    const secondConsciousness = param(ctx, 'otherConsciousnessId')
    const secondBody = param(ctx, 'toBodyId') ?? targetRefs(ctx)[0]?.id
    if (!firstConsciousness || !firstBody || !secondConsciousness || !secondBody) return []
    return [
      {
        type: 'CONSCIOUSNESS_TRANSFERRED',
        payload: {
          consciousnessId: firstConsciousness,
          fromBodyId: firstBody,
          toBodyId: secondBody,
        },
      },
      {
        type: 'CONSCIOUSNESS_TRANSFERRED',
        payload: {
          consciousnessId: secondConsciousness,
          fromBodyId: secondBody,
          toBodyId: firstBody,
        },
      },
    ]
  }

// ──────────────────────────────────────────────
// Knowledge
// ──────────────────────────────────────────────

export interface KnowledgeGrantOptions {
  factId: Resolvable<string>
  observerId?: Resolvable<string>
  state?: KnowledgeRecord['state']
  confidence?: number
}

/**
 * The output of every spying hatsu. `BELIEVED` is how a deception is modelled:
 * the observer holds a fact the world contradicts.
 */
export const knowledgeGrant =
  (options: KnowledgeGrantOptions): EffectBuilder =>
  (ctx) => [
    {
      type: 'KNOWLEDGE_GRANTED',
      payload: {
        observerId: options.observerId ? resolve(options.observerId, ctx) : ctx.actorId,
        record: {
          factId: resolve(options.factId, ctx),
          state: options.state ?? 'KNOWN',
          ...(options.confidence === undefined ? {} : { confidence: options.confidence }),
          acquiredAt: fallbackCursor(ctx),
        },
      },
    },
  ]

/** Broadcasts the same belief to a list of observers (Without You, Metamorphosen). */
export const beliefBroadcast =
  (options: { factId: Resolvable<string>; observerIds: Resolvable<string[]> }): EffectBuilder =>
  (ctx) =>
    resolve(options.observerIds, ctx).flatMap((observerId) =>
      knowledgeGrant({
        factId: options.factId,
        observerId,
        state: 'BELIEVED',
      })(ctx),
    )

// ──────────────────────────────────────────────
// Ability ownership
// ──────────────────────────────────────────────

export interface AbilityTransferOptions {
  abilityId?: Resolvable<string | undefined>
  ownerId?: Resolvable<string | undefined>
  reason?: string
}

export const abilityGrant =
  (options: AbilityTransferOptions = {}): EffectBuilder =>
  (ctx) => {
    const abilityId = options.abilityId
      ? resolve(options.abilityId, ctx)
      : param(ctx, 'targetAbilityId')
    const ownerId = options.ownerId ? resolve(options.ownerId, ctx) : ctx.actorId
    return abilityId && ownerId
      ? [{ type: 'ABILITY_GRANTED', payload: { ownerId, abilityId } }]
      : []
  }

export const abilityRevoke =
  (options: AbilityTransferOptions = {}): EffectBuilder =>
  (ctx) => {
    const abilityId = options.abilityId
      ? resolve(options.abilityId, ctx)
      : param(ctx, 'targetAbilityId')
    const ownerId = options.ownerId
      ? resolve(options.ownerId, ctx)
      : (param(ctx, 'victimId') ?? targetRefs(ctx)[0]?.id)
    return abilityId && ownerId
      ? [
          {
            type: 'ABILITY_REVOKED',
            payload: { ownerId, abilityId, ...(options.reason ? { reason: options.reason } : {}) },
          },
        ]
      : []
  }

// ──────────────────────────────────────────────
// Mutating a running effect
// ──────────────────────────────────────────────

export interface EffectStateOptions {
  effectId?: Resolvable<string | undefined>
  state: EffectInstance['state']
  attributes?: Resolvable<Record<string, unknown>>
}

export const setEffectState =
  (options: EffectStateOptions): EffectBuilder =>
  (ctx) => {
    const id = options.effectId ? resolve(options.effectId, ctx) : param(ctx, 'effectId')
    if (!id) return []
    return [
      {
        type: 'EFFECT_STATE_CHANGED',
        payload: {
          effectId: id,
          state: options.state,
          ...(options.attributes ? { attributes: resolve(options.attributes, ctx) } : {}),
        },
      },
    ]
  }

export const endEffect = (effectIdOption?: Resolvable<string | undefined>): EffectBuilder =>
  setEffectState({ effectId: effectIdOption, state: 'ENDED' })

export interface CounterOptions {
  effectId?: Resolvable<string | undefined>
  increments?: Resolvable<Record<string, number>>
  attributes?: Resolvable<Record<string, unknown>>
  append?: Resolvable<Record<string, unknown[]>>
}

/**
 * The price side of a hatsu: Emperor Time's spent lifespan, Contagion's levels,
 * a cohort gaining a member. Everything the `cost` field promises.
 */
export const attributeCounter =
  (options: CounterOptions): EffectBuilder =>
  (ctx) => {
    const id = options.effectId ? resolve(options.effectId, ctx) : param(ctx, 'effectId')
    if (!id) return []
    return [
      {
        type: 'EFFECT_ATTRIBUTE_CHANGED',
        payload: {
          effectId: id,
          ...(options.attributes ? { attributes: resolve(options.attributes, ctx) } : {}),
          ...(options.increments ? { increments: resolve(options.increments, ctx) } : {}),
          ...(options.append ? { append: resolve(options.append, ctx) } : {}),
        },
      },
    ]
  }
