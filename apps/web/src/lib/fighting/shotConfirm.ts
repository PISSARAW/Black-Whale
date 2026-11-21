import type { ArcadeFighter } from './types'

/**
 * A shot that lands confirms the attack that fired it (a ranged shot or a Hatsu volley), while
 * that attack still runs: its cancels on hit (an accélération, an authored chain) become
 * available, exactly as for a strike. A blocked or avoided bullet confirms nothing. Duel tuning, not canon.
 */
export function confirmShot(
  attacker: ArcadeFighter,
  shot: { fighterId: string },
  defence: { blocked: boolean; avoided: boolean },
): ArcadeFighter {
  const attack = attacker.attack
  if (defence.blocked || defence.avoided || !attack?.projectileSpawned) return attacker
  if (shot.fighterId !== attacker.id || attack.confirmedHit) return attacker
  return { ...attacker, attack: { ...attack, confirmedHit: true } }
}
