import type { HatsuInteractionKind, HatsuProfile } from '$lib/nen/hatsuRegistry'
import { visualSignatureFor } from '$lib/nen/hatsuRegistry'
import { DEFAULT_LOCALE, type Locale } from './config'
import { hatsuFr, hatsuManifestationFr, type HatsuTextOverride } from './messages/hatsu-fr'

/**
 * The Hatsu registry is written in English and audited there; the other locales
 * overlay their text on it, keyed by id. Anything not structural — the id, the
 * kind, the colour — is what gets replaced.
 */
/**
 * Widened to a plain string key on purpose. `hatsuFr` is exhaustive where it is
 * declared — that is what `Record<HatsuId, …>` buys — but a profile arriving
 * here is only ever *looked up*, and callers legitimately hand over ids the
 * type does not know: a synthetic profile in a test, an id read from
 * sessionStorage. A miss falls back to English, which is the right answer.
 */
const OVERLAYS: Partial<Record<Locale, Record<string, HatsuTextOverride>>> = { fr: hatsuFr }
const MANIFESTATIONS: Partial<Record<Locale, Record<HatsuInteractionKind, string>>> = {
  fr: hatsuManifestationFr,
}

/**
 * The profile as the visitor should read it. Ids, kinds and colours are
 * untouched, so every branch that dispatches on them keeps working — only the
 * prose changes.
 */
export function localizeHatsu(
  profile: HatsuProfile,
  locale: Locale = DEFAULT_LOCALE,
): HatsuProfile {
  const overlay = OVERLAYS[locale]?.[profile.id]
  return overlay ? { ...profile, ...overlay } : profile
}

export function localizeHatsuList(
  profiles: HatsuProfile[],
  locale: Locale = DEFAULT_LOCALE,
): HatsuProfile[] {
  return profiles.map((profile) => localizeHatsu(profile, locale))
}

/** The signature line the effect layer prints under the active technique. */
export function manifestationFor(profile: HatsuProfile, locale: Locale = DEFAULT_LOCALE): string {
  return MANIFESTATIONS[locale]?.[profile.kind] ?? visualSignatureFor(profile).manifestation
}
