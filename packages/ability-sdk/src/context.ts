import type { AbilityContext } from '@black-whale/nen-engine'
import type { EntityRef, StoryCursor } from '@black-whale/canon-engine'

/** A value a module either fixes at definition time or reads from the activation. */
export type Resolvable<T> = T | ((ctx: AbilityContext) => T)

export function resolve<T>(value: Resolvable<T>, ctx: AbilityContext): T {
  return typeof value === 'function' ? (value as (ctx: AbilityContext) => T)(ctx) : value
}

/**
 * A preview cursor. Modules must stay plannable outside a branch, so the UI can
 * show a "Why?" panel before anything is applied to the world.
 */
export function fallbackCursor(ctx: AbilityContext): StoryCursor {
  return (
    ctx.cursor ?? {
      branchId: 'preview',
      ordinal: 0,
      eventId: ctx.eventId,
      chapterNumber: 0,
      localSequence: 0,
    }
  )
}

export function actorRef(ctx: AbilityContext): EntityRef {
  return ctx.actor ?? { id: ctx.actorId, kind: 'CHARACTER' }
}

export function targetRefs(ctx: AbilityContext): EntityRef[] {
  return ctx.targetRefs ?? ctx.targets.map((id) => ({ id, kind: 'OBJECT' as const }))
}

/**
 * The body standing behind an entity reference.
 *
 * A body state is carried by a body: naming a character has to resolve to their
 * own body, or the reducer will refuse the event and abort the whole step. No
 * body found means no event — a silent no-op beats a transaction that takes the
 * rest of the activation down with it.
 */
export function bodyRef(ctx: AbilityContext, ref: EntityRef | undefined): EntityRef | undefined {
  if (!ref || ref.kind === 'BODY') return ref
  const body = Object.values(ctx.worldState?.entities ?? {}).find(
    (entity) => entity.kind === 'BODY' && entity.originalCharacterId === ref.id,
  )
  return body ? { id: body.id, kind: 'BODY' } : undefined
}

/**
 * The body state behind an entity id, characters included.
 *
 * The kernel indexes `bodyStates` by body; a caller holding a character reads
 * through to that character's body rather than always missing.
 */
export function bodyStateOf(ctx: AbilityContext, entityId: string): string | undefined {
  const states = ctx.worldState?.bodyStates
  if (!states) return undefined
  const direct = states[entityId]
  if (direct !== undefined) return direct
  const body = Object.values(ctx.worldState?.entities ?? {}).find(
    (entity) => entity.kind === 'BODY' && entity.originalCharacterId === entityId,
  )
  return body ? states[body.id] : undefined
}

/** Reads a string activation parameter, or undefined when the caller omitted it. */
export function param(ctx: AbilityContext, key: string): string | undefined {
  const value = ctx.parameters?.[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function numberParam(ctx: AbilityContext, key: string): number | undefined {
  const value = ctx.parameters?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export function listParam(ctx: AbilityContext, key: string): string[] {
  const value = ctx.parameters?.[key]
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : []
}

/**
 * Reads an attribute off the effect an activation refers to. Lets a follow-up
 * action work from what the world already holds — the ability a loan carries,
 * the level a member reached — instead of asking the caller to repeat it.
 */
export function effectAttribute(
  ctx: AbilityContext,
  key: string,
  parameterKey = 'effectId',
): unknown {
  const id = param(ctx, parameterKey)
  return id ? ctx.worldState?.effects[id]?.attributes[key] : undefined
}

/**
 * Effect ids are derived, never random: replaying the same activation must
 * produce the same effect rather than a duplicate.
 */
export function effectId(ctx: AbilityContext, discriminator: string): string {
  return `${ctx.abilityId}:${ctx.actorId}:${ctx.eventId}:${discriminator.toLowerCase()}`
}
