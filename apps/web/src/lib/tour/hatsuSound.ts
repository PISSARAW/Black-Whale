import { playHatsuActivationSignature } from '$lib/audio/hatsuSounds'
import type { HatsuProfile } from '$lib/nen/hatsuRegistry'
import type { TourReport } from './hatsu'
import { playTourReportSound } from './reportSound'

/** Give a cast its ability-specific voice as well as the sound of its physical result. */
export function playTourHatsuSound(profile: HatsuProfile | null, report: TourReport): void {
  if (profile) playHatsuActivationSignature(profile.id)
  playTourReportSound(report)
}
