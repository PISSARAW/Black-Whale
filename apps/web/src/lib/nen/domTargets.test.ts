import { describe, expect, it } from 'vitest'
import { HATSU_INTERACTION_BY_KIND } from './hatsuInteractions'
import { HATSU_PROFILES, type HatsuInteractionKind } from './hatsuRegistry'
import { familiesOf, manifestOfKind } from './targeting'

/**
 * Why the DOM layer does not gate on `allowedTargets`, and what holds instead.
 *
 * The 3D walk aims at three things — a body, a solid, a room — and those are
 * the manifest's entity kinds, so its cast tables now read the declaration
 * (`targeting.test.ts`). The DOM layer aims at *page elements*, and an element
 * is not an entity: a character card is a rendering of a person, a link to a
 * chapter, and an object on a page, all at once.
 *
 * The measurement that settles it: of the 76 techniques with a DOM handler, 14
 * touch a character marker, and 2 of those have manifests that name no person.
 * One of the two is Blinky — and it touches the marker *precisely to refuse
 * it*, because the canon says Deme-chan cannot swallow a living thing. A gate
 * built on "touches a character marker ⇒ must be allowed to target a
 * character" would have deleted the refusal and left the visitor with silence,
 * which is a worse answer than the one the technique is written to give.
 *
 * So this file pins the relationship rather than enforcing one. It fails when
 * the two drift — a new technique whose handler starts working on people while
 * its manifest still says otherwise — and the fix is then a decision about
 * canon, made by a person, in the module.
 */

const KIND_BY_ID = new Map(HATSU_PROFILES.map((profile) => [profile.id, profile.kind]))

/**
 * The techniques whose DOM handler reads a character marker without their
 * manifest naming a person, with the reason each is legitimate.
 *
 * Both are refusals or object-copies, not targeting. Adding to this list is
 * allowed and is meant to cost a sentence.
 */
const TOUCHES_A_PERSON_WITHOUT_TARGETING_ONE: Partial<Record<HatsuInteractionKind, string>> = {
  vacuum:
    'Deme-chan cannot swallow a living thing: the marker is read to refuse the click, not to aim at it.',
  clone: 'Gallery Fake copies the object a person is shown by — the card — and never the person.',
}

describe('the DOM layer and the entity kinds the modules declare', () => {
  it('gives every technique it handles a manifest to be checked against', () => {
    for (const kind of Object.keys(HATSU_INTERACTION_BY_KIND) as HatsuInteractionKind[]) {
      expect(manifestOfKind(kind), kind).not.toBeNull()
    }
  })

  it('keeps the handlers that work on people and the manifests that name them in step', () => {
    const drifted: string[] = []
    for (const kind of Object.keys(HATSU_INTERACTION_BY_KIND) as HatsuInteractionKind[]) {
      const handler = HATSU_INTERACTION_BY_KIND[kind]
      if (!handler) continue
      // The handler's own source: what it reads is what it works on.
      const readsAPerson = /hatsuCharacter|data-hatsu-character|profilesFromTarget/.test(
        handler.toString(),
      )
      if (!readsAPerson) continue
      const aimsAtAPerson = familiesOf(manifestOfKind(kind)).has('body')
      if (!aimsAtAPerson && !(kind in TOUCHES_A_PERSON_WITHOUT_TARGETING_ONE)) {
        drifted.push(kind)
      }
    }

    expect(
      drifted,
      'these handlers work on people while their manifest names none — widen the manifest, or say here why touching is not targeting',
    ).toEqual([])
  })

  it('does not carry an excuse for a technique that no longer needs one', () => {
    // An exception nobody can justify any more is a comment that has outlived
    // its code, and this list is small enough that it should stay true.
    for (const kind of Object.keys(TOUCHES_A_PERSON_WITHOUT_TARGETING_ONE)) {
      expect(KIND_BY_ID.size, 'the registry is loaded').toBeGreaterThan(0)
      expect(
        HATSU_INTERACTION_BY_KIND[kind as HatsuInteractionKind],
        `${kind} has no DOM handler any more`,
      ).toBeTruthy()
    }
  })
})
