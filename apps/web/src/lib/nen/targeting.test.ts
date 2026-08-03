import { describe, expect, it } from 'vitest'
import { TOUR_CAST_KINDS } from '$lib/tour/hatsu'
import { HATSU_PROFILES } from './hatsuRegistry'
import { INTERACTION_MANIFESTS } from './interactionManifests.gen'
import {
  acceptsFamily,
  familiesOf,
  manifestFor,
  manifestOfKind,
  type TargetFamily,
} from './targeting'

/**
 * The renderers used to decide alone what a technique could be aimed at, and
 * they disagreed with the modules: twenty-four of the eighty-two were being
 * cast in the walk at a target their own manifest forbade. The manifests were
 * the side nobody read, so they were the side that was widened; these tests are
 * what stops the two drifting apart again.
 *
 * The subset direction is the one that matters. What the walk implements must
 * be a subset of what the modules allow — if it ever is not, the gate in front
 * of each cast table silently refuses something a visitor used to be able to
 * do, which is exactly the kind of regression a table nobody checks produces.
 */

const FAMILIES: TargetFamily[] = ['solid', 'body', 'room']

describe('what a technique may be aimed at', () => {
  it('declares one manifest for every ability the site casts', () => {
    expect(INTERACTION_MANIFESTS).toHaveLength(HATSU_PROFILES.length)
    for (const profile of HATSU_PROFILES) {
      expect(manifestFor(profile.id), profile.id).not.toBeNull()
      expect(manifestOfKind(profile.kind), profile.kind).toMatchObject({ abilityId: profile.id })
    }
  })

  it('gives every ability something to aim at', () => {
    for (const profile of HATSU_PROFILES) {
      expect(manifestFor(profile.id)!.allowedTargets.length, profile.id).toBeGreaterThan(0)
    }
  })

  it('leaves an ability that only marks the timeline out of the walk', () => {
    // Double Face bookmarks an event, and an event is not a thing standing in
    // a room: it declares `EVENT` alone, so no physical family, so the walk
    // has nothing to offer it — and the DOM layer, which does have a timeline,
    // still does. A family of none is a real answer here, not a gap.
    const bookmark = manifestFor('double-face')
    expect(bookmark?.allowedTargets).toEqual(['EVENT'])
    expect(familiesOf(bookmark).size).toBe(0)
    for (const family of FAMILIES) expect(TOUR_CAST_KINDS[family].has('bookmark')).toBe(false)
  })

  it('allows every cast the walk actually implements', () => {
    for (const family of FAMILIES) {
      for (const kind of TOUR_CAST_KINDS[family]) {
        expect(acceptsFamily(kind, family), `${kind} is cast on a ${family}`).toBe(true)
      }
    }
  })

  it('refuses what nothing declares', () => {
    expect(acceptsFamily(null, 'room')).toBe(false)
    expect(acceptsFamily(undefined, 'body')).toBe(false)
    expect(manifestFor('no-such-ability')).toBeNull()
    expect(familiesOf(null).size).toBe(0)
  })

  it('leaves an aura and an event out of the three physical families', () => {
    // Both are declared targets and neither is a thing standing in a room: an
    // aura belongs to the body emitting it, an event to the timeline. A
    // renderer that gains either reads the same manifest rather than a new
    // table of its own.
    const auraOnly = INTERACTION_MANIFESTS.find(
      (manifest) =>
        manifest.allowedTargets.length > 0 &&
        manifest.allowedTargets.every((target) => target === 'AURA' || target === 'EVENT'),
    )
    if (auraOnly) expect(familiesOf(auraOnly).size).toBe(0)
  })
})
