import { get } from 'svelte/store'
import { immersiveMode } from '../state/immersiveMode'

/**
 * Haptic Feedback Service
 * Only triggers if immersiveMode is active and navigator.vibrate is supported.
 */

function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator && get(immersiveMode)
}

/**
 * Trigger a constant, subtle rhythmic vibration for the engine rumble.
 * Tier 1 (top): Very subtle
 * Tier 5 (bottom): Stronger
 */
export function triggerEngineRumble(tier: number) {
  if (!canVibrate()) return

  // Example pattern: vibrate(intensity), pause, vibrate(intensity)...
  // The lower the tier (higher number), the longer the vibration bursts.
  const intensity = Math.min(Math.max(tier * 10, 10), 100)
  // We can't actually control "intensity" in Web API, only duration.
  // So we use longer pulses for stronger feelings.
  navigator.vibrate([intensity, 50, intensity])
}

/**
 * Heartbeat pattern for Aura presence/danger.
 */
export function triggerHeartbeat() {
  if (!canVibrate()) return
  // Ba-dum... Ba-dum...
  navigator.vibrate([100, 100, 150, 400])
}

/**
 * Heavy interaction like opening a thick steel bulkhead.
 */
export function triggerHeavyInteraction() {
  if (!canVibrate()) return
  // A solid, single thud.
  navigator.vibrate(80)
}
