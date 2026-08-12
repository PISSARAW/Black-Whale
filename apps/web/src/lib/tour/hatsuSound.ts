import { soundedFrom } from '$lib/audio/space'
import { playHatsuActivationSignature } from '$lib/audio/hatsuSounds'
import type { HatsuProfile } from '$lib/nen/hatsuRegistry'
import type { TourReport } from './hatsu'
import { playTourReportSound } from './reportSound'
import { placeOfReport } from './soundPlace'

/**
 * Give a cast its ability-specific voice as well as the sound of its physical
 * result — the first at the visitor, the second where it landed.
 *
 * They are two events and are placed as two. The signature is the technique
 * going out, and it goes out of the visitor: it belongs in the middle of their
 * head however far away the thing it acts on is. The result is the thing that
 * happened, and it happened over there. Placing the pair together would have
 * put the sound of Air Blow leaving the palm three hundred metres away, and
 * placing neither is what the walk did before.
 *
 * Each is wrapped anyway, because `soundedFrom` is also the variation: a cast
 * detunes as one, and a cast made twice is not the same recording twice.
 *
 * Wrapped here and not in `reportSound`, which the reconstruction scene calls
 * too: that scene has no walk, so nothing has told the ear where it is standing
 * and a place worked out against a listener at the origin would be a fiction.
 */
export function playTourHatsuSound(profile: HatsuProfile | null, report: TourReport): void {
  if (profile) soundedFrom(null, () => playHatsuActivationSignature(profile.id))
  soundedFrom(placeOfReport(report), () => playTourReportSound(report))
}
