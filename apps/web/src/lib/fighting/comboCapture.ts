import type { ArcadeFighter } from './types'

/**
 * A combo capture (a throw that ends an accélération, throwRules.ts) holds its target
 * instead of throwing it away. So does Feitan's throw while Pain Packer is worn: the hot
 * zone (signatureCombosSecond.ts) keeps the body at his feet, where Rising Sun will burn.
 * Kept free of runtime imports: frameData.ts reads it.
 */
export function throwKnockback(
  move: { variant?: string },
  attacker: ArcadeFighter,
  base: number,
): number {
  return move.variant === 'throw' && (attacker.attack?.accel || hotZoneThrow(attacker)) ? 0 : base
}

/** Only Feitan's own outfit: the armour is the condition, not a bonus to the throw. */
export function hotZoneThrow(attacker: ArcadeFighter): boolean {
  return attacker.id === 'feitan' && Boolean(attacker.hatsuEffects.painPacker?.armour)
}
