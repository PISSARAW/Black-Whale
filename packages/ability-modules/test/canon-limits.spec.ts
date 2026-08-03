import { describe, expect, it } from 'vitest'
import { createEmptyWorld } from '@black-whale/canon-engine'
import type { AbilityContext } from '@black-whale/nen-engine'
import { bungeeGum } from '../src/index.js'

/**
 * The canon limits, tested where they are enforced.
 *
 * These three rules — a filament snaps past ten metres, one concealed with In
 * is invisible to every perspective but Gyo, one programmed before death keeps
 * working after it — were pinned only by the 3D walk's tests. That made them
 * true of the walk rather than true of the ability: the DOM layer renders the
 * same technique and inherited none of them, and a fourth renderer would have
 * inherited none either.
 *
 * ADR-001 chantier 3 moves them here, to the module that actually applies them.
 * What stays in the renderers' tests is what those tests are for — that the
 * walk draws the strand, that the page dims the section — and no longer what
 * the ability is allowed to do.
 */

const cursor = {
  branchId: 'simulation',
  ordinal: 4,
  eventId: 'event-4',
  chapterNumber: 357,
  localSequence: 2,
}

/** Hisoka, a wall to stick to, and the ability in his hands. */
function scene() {
  const worldState = createEmptyWorld(cursor)
  worldState.entities.hisoka = {
    id: 'hisoka',
    kind: 'CHARACTER',
    label: 'Hisoka',
    metadata: { mentalState: 'ACTIVE' },
  }
  worldState.entities.wall = { id: 'wall', kind: 'OBJECT', label: 'Wall' }
  worldState.abilitiesByOwner.hisoka = ['bungee-gum']
  return worldState
}

function context(actionId: string, parameters: Record<string, unknown> = {}): AbilityContext {
  return {
    abilityId: 'bungee-gum',
    actorId: 'hisoka',
    actor: { id: 'hisoka', kind: 'CHARACTER' as const },
    targets: ['wall'],
    targetRefs: [{ id: 'wall', kind: 'OBJECT' as const }],
    anchors: [
      { entity: { id: 'hisoka', kind: 'CHARACTER' as const } },
      { entity: { id: 'wall', kind: 'OBJECT' as const } },
    ],
    eventId: cursor.eventId,
    actionId,
    cursor,
    worldState: scene(),
    parameters,
  } as AbilityContext
}

describe('Bungee Gum, as the module enforces it', () => {
  it('lets a detached filament hold at ten metres', () => {
    const plan = bungeeGum.plan(context('detach', { distanceMeters: 10 }))

    expect(plan.status).toBe('AVAILABLE')
    expect(bungeeGum.execute(context('detach', { distanceMeters: 10 })).allowed).toBe(true)
  })

  it('snaps it past ten, and says which condition broke', () => {
    const plan = bungeeGum.plan(context('detach', { distanceMeters: 10.5 }))

    expect(plan.status).toBe('LOCKED')
    const distance = plan.conditions.find((condition) => condition.label.includes('10 metres'))
    expect(distance?.status).toBe('UNMET')
    expect(bungeeGum.execute(context('detach', { distanceMeters: 10.5 })).allowed).toBe(false)
  })

  it('does not guess when nobody says how far the target is', () => {
    // The walk always knows the distance; a page rarely does. Unknown is a
    // third answer on purpose — it leaves the action offered and unexplained
    // rather than silently forbidden.
    const plan = bungeeGum.plan(context('detach'))

    expect(plan.status).toBe('UNKNOWN')
  })

  it('lays a trap that is real and unseen', () => {
    const result = bungeeGum.execute(context('set-trap'))
    const effect = result.events?.[0]?.payload.effect

    expect(result.allowed).toBe(true)
    expect(effect?.kind).toBe('ELASTIC_BINDING')
    // Masked, not absent: the trap exists in the world state and only the
    // perspective layer decides who is shown it.
    expect(effect?.attributes?.masked).toBe(true)
  })

  it('keeps working after its user dies, on the organ it was programmed for', () => {
    const result = bungeeGum.execute(context('program-post-mortem', { organ: 'lungs' }))
    const effect = result.events?.[0]?.payload.effect

    expect(result.allowed).toBe(true)
    expect(effect?.attributes?.postMortem).toBe(true)
    expect(effect?.attributes?.organ).toBe('lungs')
    expect(effect?.attributes?.purpose).toBe('resuscitation')
  })

  it('defaults that programming to the heart, which is what chapter 357 shows', () => {
    const result = bungeeGum.execute(context('program-post-mortem'))

    expect(result.events?.[0]?.payload.effect.attributes?.organ).toBe('heart')
  })
})
