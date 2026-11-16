import { illumiBodyFree } from './illumiState'
import { predatorNenLocked } from './predatorSeal'
/**
 * On (怨) in the 2D duel, after the film *Hunter x Hunter: The Last Mission*.
 *
 * Canon this module translates:
 * - On is the dark counterpart of Nen, fed by hatred rather than life energy:
 *   it is sworn from a grudge (`grudge`), never bought with aura.
 * - It is a contract: once sworn it cannot be dropped at will, it seals the
 *   user's own Nen (no Hatsu, Ken, Ko or free Ryu) and it eats the body.
 * - Its blood seals the Nen of whoever it touches (Kurapika): a clean On blow
 *   seals the victim's Hatsu for a while.
 * - Netero beat Jed by guarding every blow until the hatred ran dry: each
 *   blocked On strike burns grudge, Ken far more than a plain guard. When the
 *   grudge is spent the On collapses and leaves the body in Zetsu.
 */
import { transitionNen } from '@black-whale/nen-engine'
import type { ArcadeFighter, FightInput, FightNenZone, FightState, FightSide } from './types'

/** Grudge gained per point of health lost: half a life bar fills it. */
export const ON_GRUDGE_PER_DAMAGE = 2
/** Hatred required to swear the On contract. */
export const ON_OATH_GRUDGE = 50
/** Grudge burned every second the On burns (a full grudge lasts about 11 s). */
export const ON_GRUDGE_BURN_PER_SECOND = 9
/** Health consumed every second: the contract eats the body. Never below 1. */
export const ON_HEALTH_PER_SECOND = 2.5
/** Strike power on top of the imposed Ren and Ryu. */
export const ON_ATTACK_BONUS = 0.3
/** Grudge burned when a blow is guarded, and when it lands on Ken. */
export const ON_BLOCKED_BURN = 8
export const ON_KEN_BURN = 16
/** Frames during which a clean On blow seals the victim's Hatsu (2 s). */
export const ON_SEAL_FRAMES = 120
/** The distribution On imposes: hatred pours into the limbs that strike. */
export const ON_DISTRIBUTION: Record<FightNenZone, number> = {
  hands: 40,
  feet: 30,
  torso: 20,
  head: 10,
}

const FIGHT_FPS = 60
const NO_ON = { grudge: 0, sealFrames: 0 } as const

export function onOf(fighter: Pick<ArcadeFighter, 'on'>) {
  return fighter.on ?? NO_ON
}

export function canSwearOn(fighter: ArcadeFighter): boolean {
  if (!illumiBodyFree(fighter)) return false
  if (predatorNenLocked(fighter)) return false
  return (
    !fighter.nen.on &&
    fighter.nen.mode !== 'zetsu' &&
    !fighter.auraExhausted &&
    onOf(fighter).grudge >= ON_OATH_GRUDGE
  )
}

/** Hatsu is sealed while the fighter's own On burns, or while On blood is in them. */
export function hatsuSealedByOn(fighter: Pick<ArcadeFighter, 'nen' | 'on'>): boolean {
  return fighter.nen.on || onOf(fighter).sealFrames > 0
}

/**
 * Aura + Hatsu held together swears the On. While it burns every aura input
 * is ignored: the contract, not the player, decides the aura.
 * Returns `null` when On has nothing to say and ordinary Nen applies.
 */
export function applyOnContext(fighter: ArcadeFighter, input: FightInput): ArcadeFighter | null {
  if (fighter.nen.on) return fighter
  if (!input.aura || !input.hatsu || !canSwearOn(fighter)) return null
  const result = transitionNen(fighter.nen, {
    type: 'ON',
    on: true,
    distribution: ON_DISTRIBUTION,
  })
  return result.accepted ? { ...fighter, nen: result.state, hatsuChargeFrames: 0 } : null
}

/** One frame of On: burns grudge and health, wears seals off, collapses when spent. */
export function advanceOn(fighter: ArcadeFighter): ArcadeFighter {
  const on = onOf(fighter)
  const sealFrames = Math.max(0, on.sealFrames - 1)
  if (!fighter.nen.on) {
    return on.sealFrames === sealFrames ? fighter : { ...fighter, on: { ...on, sealFrames } }
  }
  const grudge = Math.max(0, on.grudge - ON_GRUDGE_BURN_PER_SECOND / FIGHT_FPS)
  const health =
    fighter.health > 1
      ? Math.max(1, fighter.health - ON_HEALTH_PER_SECOND / FIGHT_FPS)
      : fighter.health
  const next = { ...fighter, health, on: { grudge, sealFrames } }
  return grudge > 0 ? next : collapseOn(next)
}

/** Hatred spent: the contract releases a body with no aura left to raise. */
function collapseOn(fighter: ArcadeFighter): ArcadeFighter {
  const released = transitionNen(fighter.nen, { type: 'ON', on: false })
  const zetsu = transitionNen(released.state, { type: 'ZETSU' })
  return { ...fighter, nen: zetsu.state, aura: 0, auraExhausted: true }
}

function burnGrudge(fighter: ArcadeFighter, amount: number): ArcadeFighter {
  const on = onOf(fighter)
  const grudge = Math.max(0, on.grudge - amount)
  const next = { ...fighter, on: { ...on, grudge } }
  return grudge > 0 || !fighter.nen.on ? next : collapseOn(next)
}

function feedGrudge(before: ArcadeFighter, after: ArcadeFighter): ArcadeFighter {
  const lost = before.health - after.health
  if (lost <= 0 || after.nen.on) return after
  const on = onOf(after)
  const grudge = Math.min(100, on.grudge + lost * ON_GRUDGE_PER_DAMAGE)
  return { ...after, on: { ...on, grudge } }
}

function sealHatsu(fighter: ArcadeFighter): ArcadeFighter {
  return { ...fighter, on: { ...onOf(fighter), sealFrames: ON_SEAL_FRAMES } }
}

/**
 * Applied once per frame after impacts resolve. `before` is the state the
 * impacts started from, so the On user is read before the blow spent itself.
 * Damage taken during On feeds nothing: a burning grudge does not refill.
 */
export function resolveOnImpacts(before: FightState, after: FightState): FightState {
  const fed: FightState = {
    ...after,
    player: feedGrudge(before.player, after.player),
    opponent: feedGrudge(before.opponent, after.opponent),
  }
  const impact = after.impact
  if (!impact || impact.sequence === before.impact?.sequence) return fed
  if (!before[impact.attacker].nen.on || impact.avoided) return fed
  return resolveOnBlow(fed, impact.attacker, impact.blocked)
}

function resolveOnBlow(state: FightState, attacker: FightSide, blocked: boolean): FightState {
  const defenderSide: FightSide = attacker === 'player' ? 'opponent' : 'player'
  const defender = state[defenderSide]
  if (!blocked) return { ...state, [defenderSide]: sealHatsu(defender) }
  const burn = defender.nen.ken ? ON_KEN_BURN : ON_BLOCKED_BURN
  return { ...state, [attacker]: burnGrudge(state[attacker], burn) }
}

/** The CPU swears On when hatred is ripe and its back is to the wall. */
export function opponentWantsOn(fighter: ArcadeFighter): boolean {
  return canSwearOn(fighter) && fighter.health <= 55
}
