/**
 * What a technique may be aimed at — read from the modules, not restated.
 *
 * Every renderer has to answer this question, and until ADR-001 chantier 3
 * each of them answered it alone: the tour by which of its three cast tables
 * carried the kind, the DOM layer by whichever element its handler happened to
 * accept. The modules had been declaring the answer all along in
 * `interactionManifest.allowedTargets`, with nobody reading it — and the two
 * had drifted far enough that twenty-four techniques were being cast at a
 * target their own manifest forbade.
 *
 * The manifests are now compiled into `interactionManifests.gen.ts` and this
 * is the one place that maps them onto what a renderer actually has in front
 * of it. Renderers keep deciding *how* a cast looks; they no longer decide
 * whether it is allowed.
 */
import type { AbilityInteractionManifest, NenAllowedTarget } from '@black-whale/nen-engine'
import { INTERACTION_MANIFESTS } from './interactionManifests.gen'
import { HATSU_PROFILES, type HatsuInteractionKind } from './hatsuRegistry'

/**
 * The three things a reconstruction offers to aim at. The names are the walk's,
 * because that is where they are physical: a body to stand in front of, a solid
 * to touch, a room to be inside.
 */
export type TargetFamily = 'body' | 'solid' | 'room'

/**
 * How the declared targets land in a reconstruction.
 *
 * `AURA` and `EVENT` are deliberately unmapped: an aura belongs to the body
 * that emits it and an event to the timeline, so neither adds a thing to point
 * at. They stay in the manifests because the DOM layer and the "Why?" panel do
 * have both, and a renderer that gains them should read the same declaration.
 */
const FAMILY_OF: Record<NenAllowedTarget, TargetFamily | null> = {
  CHARACTER: 'body',
  BODY: 'body',
  OBJECT: 'solid',
  LOCATION: 'room',
  AURA: null,
  EVENT: null,
}

const MANIFEST_BY_ID = new Map(
  INTERACTION_MANIFESTS.map((manifest) => [manifest.abilityId, manifest]),
)

/**
 * Keyed by kind as well as by id, because the renderers dispatch on the kind:
 * it is one per ability by construction (the compiler refuses a second), so
 * the two keys name the same eighty-two manifests.
 */
const MANIFEST_BY_KIND = new Map(
  HATSU_PROFILES.flatMap((profile) => {
    const manifest = MANIFEST_BY_ID.get(profile.id)
    return manifest ? ([[profile.kind, manifest]] as const) : []
  }),
)

export function manifestFor(id: string | null | undefined): AbilityInteractionManifest | null {
  return id ? (MANIFEST_BY_ID.get(id) ?? null) : null
}

export function manifestOfKind(
  kind: HatsuInteractionKind | null | undefined,
): AbilityInteractionManifest | null {
  return kind ? (MANIFEST_BY_KIND.get(kind) ?? null) : null
}

/** Which of the three a manifest's declared targets amount to. */
export function familiesOf(manifest: AbilityInteractionManifest | null): Set<TargetFamily> {
  const families = new Set<TargetFamily>()
  for (const target of manifest?.allowedTargets ?? []) {
    const family = FAMILY_OF[target]
    if (family) families.add(family)
  }
  return families
}

/**
 * Whether a technique may be aimed at this kind of thing at all.
 *
 * A technique whose manifest is silent is refused rather than allowed: the
 * compiler will not emit a manifest without a target, so silence here means
 * the kind is not one the site casts, and casting it would be aiming something
 * nobody declared.
 */
export function acceptsFamily(
  kind: HatsuInteractionKind | null | undefined,
  family: TargetFamily,
): boolean {
  return familiesOf(manifestOfKind(kind)).has(family)
}
