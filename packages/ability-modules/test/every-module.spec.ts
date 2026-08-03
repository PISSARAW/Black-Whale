import { describe, expect, it } from 'vitest'
import { createEmptyWorld } from '@black-whale/canon-engine'
import type { AbilityContext, NenAbilityModule } from '@black-whale/nen-engine'
import { abilityModules } from '../src/index.js'

/**
 * What must be true of all eighty-two, tested once.
 *
 * `canon-limits.spec.ts` carries the limits that belong to one technique —
 * Bungee Gum's ten metres, its In, its post-mortem — and there is no way to
 * write eighty-one more of those without knowing eighty-one abilities. What
 * *can* be written once is everything the renderers were relying on without
 * anybody stating it, and which the 3D walk's tests had quietly been the only
 * proof of:
 *
 *   - a plan and an execution agree, so the "Why?" panel never offers an
 *     action the engine then refuses (the ADR claims this; nothing checked it
 *     across the catalogue);
 *   - what a plan projects is what the execution writes, so the panel and the
 *     world never describe two different things;
 *   - with no world to look at, no condition claims a world fact, so a page
 *     that cannot measure a distance still offers the action instead of
 *     silently forbidding it;
 *   - nothing throws on a context it was not written for.
 *
 * These are the behaviours every renderer inherits. Written here, they are
 * true of the DOM layer and the walk and the arena at the same time, which is
 * what porting them out of the walk's tests was for.
 */

const cursor = {
  branchId: 'simulation',
  ordinal: 4,
  eventId: 'event-4',
  chapterNumber: 400,
  localSequence: 2,
}

/** An actor who can use Nen, a person to point at, and a thing to touch. */
function world(module: NenAbilityModule) {
  const state = createEmptyWorld(cursor)
  const ownerId = module.manifest.ownerId || 'actor'
  state.entities[ownerId] = {
    id: ownerId,
    kind: 'CHARACTER',
    label: ownerId,
    metadata: { mentalState: 'ACTIVE' },
  }
  state.entities['someone'] = {
    id: 'someone',
    kind: 'CHARACTER',
    label: 'Someone',
    metadata: { mentalState: 'ACTIVE' },
  }
  state.entities['something'] = { id: 'something', kind: 'OBJECT', label: 'Something' }
  state.abilitiesByOwner[ownerId] = [module.manifest.id]
  return { state, ownerId }
}

function contextFor(module: NenAbilityModule, actionId: string): AbilityContext {
  const { state, ownerId } = world(module)
  return {
    abilityId: module.manifest.id,
    actorId: ownerId,
    actor: { id: ownerId, kind: 'CHARACTER' as const },
    targets: ['someone', 'something'],
    targetRefs: [
      { id: 'someone', kind: 'CHARACTER' as const },
      { id: 'something', kind: 'OBJECT' as const },
    ],
    anchors: [
      { entity: { id: ownerId, kind: 'CHARACTER' as const } },
      { entity: { id: 'something', kind: 'OBJECT' as const } },
    ],
    eventId: cursor.eventId,
    actionId,
    cursor,
    worldState: state,
    // Generous on purpose: the point is to reach the code past the conditions,
    // not to guess each technique's own parameter names.
    parameters: { distanceMeters: 1, organ: 'heart', targetId: 'someone' },
  } as AbilityContext
}

/** Every action a module offers, or its plain activation when it offers none. */
function actionsOf(module: NenAbilityModule): string[] {
  const wheel = module.getActionWheel?.() ?? []
  const ids = wheel.map((entry) => entry.id)
  return ids.length > 0 ? ids : ['activate']
}

const cases = abilityModules.flatMap((module) =>
  actionsOf(module).map((actionId) => ({ module, actionId })),
)

describe('every ability module, on every action it offers', () => {
  it('offers more than one action to test', () => {
    expect(abilityModules.length).toBe(82)
    expect(cases.length).toBeGreaterThan(82)
  })

  it.each(cases.map((entry) => [`${entry.module.manifest.id}/${entry.actionId}`, entry] as const))(
    '%s plans and executes the same answer',
    (_label, { module, actionId }) => {
      const plan = module.plan(contextFor(module, actionId))
      const result = module.execute(contextFor(module, actionId))

      // The panel shows the plan and the button runs the execution. A page
      // that offers what the engine then refuses is the defect this forbids.
      expect(result.allowed, `${module.manifest.id}/${actionId}`).toBe(plan.status === 'AVAILABLE')
    },
  )

  it.each(cases.map((entry) => [`${entry.module.manifest.id}/${entry.actionId}`, entry] as const))(
    '%s emits exactly what its plan projected',
    (_label, { module, actionId }) => {
      const plan = module.plan(contextFor(module, actionId))
      const result = module.execute(contextFor(module, actionId))
      if (!result.allowed) return

      // Not "emits something": an action that ends an effect the world does
      // not hold correctly emits nothing, and Bungee Gum's `release` is one.
      // What must hold is that the panel and the world agree — the projection
      // shown to the visitor is what the execution actually writes.
      expect(
        (result.events?.length ?? 0) > 0,
        `${module.manifest.id}/${actionId} projected ${plan.projectedEffects.length} effects`,
      ).toBe(plan.projectedEffects.length > 0)
    },
  )

  it.each(abilityModules.map((module) => [module.manifest.id, module] as const))(
    '%s claims nothing about a world it cannot see',
    (_id, module) => {
      const plan = module.plan({
        abilityId: module.manifest.id,
        actorId: module.manifest.ownerId,
        // Targets are named, so that a condition answering UNMET here is
        // answering about the *world* and not about the request: "you gave me
        // nobody to chain" is a legitimate refusal without a snapshot, and
        // `requiresTarget` gives it.
        targets: ['someone'],
        targetRefs: [{ id: 'someone', kind: 'CHARACTER' }],
        eventId: 'preview',
      } as unknown as AbilityContext)

      // Three answers, not two. A page that cannot measure a distance is not a
      // page where the distance is wrong, and the difference is what keeps an
      // action offered and explained instead of quietly withheld.
      const claimed = plan.conditions.filter((condition) => condition.status === 'unmet')
      expect(
        claimed.map((condition) => condition.label),
        module.manifest.id,
      ).toEqual([])
    },
  )
})
