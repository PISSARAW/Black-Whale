/**
 * The shape of a duel. Sixty to ninety seconds, one room, no health bar.
 *
 * There is no quantity of harm anywhere in this type, and there is no room for
 * one: a duelist is a reservoir, a guard, and four booleans. Everything that
 * decides the outcome is *which* — which zone, which principle is up, whether
 * the Ten still holds — and never *how much* (I1).
 *
 * The one number is Ryu's split, and it is the control rather than a statistic:
 * it is never compared against the opponent's. It buys reach in one direction
 * and coverage in the other, and `resolve.ts` reads only what it covers.
 */
import { fullPool, poolOf, type AuraPool } from '../aura'
import type { Rng } from '../random'
import { seedRng } from '../random'

export type BodyZone = 'head' | 'torso' | 'arms' | 'legs'

export const BODY_ZONES: readonly BodyZone[] = ['head', 'torso', 'arms', 'legs']

export type DuelOutcome = 'playing' | 'won' | 'lost' | 'broke'

export interface DuelistState {
  pool: AuraPool
  /**
   * Share of the aura pushed into attack, 0 to 1. Above `STRIKE_THRESHOLD` a Ko
   * can be charged; below it the guard covers a second zone. That is the trade,
   * and it is continuous — the thresholds are where it changes what it *does*.
   */
  attack: number
  /** The zone Ryu is concentrated on. */
  guard: BodyZone
  gyo: boolean
  in: boolean
  ken: boolean
  /** The zone a Ko is gathered into, or null. */
  ko: BodyZone | null
  /**
   * Seconds since it was gathered. A Ko is not instant, and it must not be:
   * gathering it lights one zone and darkens three, and if the blow landed on
   * the same tick, nobody would ever have time to read that and answer. This
   * is the window Gyo is bought to see and In is bought to spoil.
   */
  gathering: number
  /**
   * Seconds spent waiting rather than pressing. A hunter is not a wall: past
   * a few seconds of standoff he closes anyway, which is what stops "hold Ken
   * and wait" from being a stalemate either side can sit in forever.
   */
  waiting: number
  /** Seconds still held by an entrave. Held, nothing is covered. */
  held: number
  /** Zero aura: the Ten no longer holds. */
  broken: boolean
  /** Dropped their aura entirely — the gamble a disengage is made of. */
  zetsu: boolean
}

export interface DuelState {
  player: DuelistState
  hunter: DuelistState
  clock: number
  /** The room the contact happened in — where the inherited entraves are. */
  spaceId: string | null
  /** Seconds of unread Zetsu accumulated towards breaking away. */
  breaking: number
  outcome: DuelOutcome
  rng: Rng
}

export function initialDuelist(pool: AuraPool = fullPool()): DuelistState {
  return {
    pool,
    attack: 0.5,
    guard: 'torso',
    gyo: false,
    in: false,
    ken: false,
    ko: null,
    gathering: 0,
    waiting: 0,
    held: 0,
    broken: pool.available <= 0,
    zetsu: false,
  }
}

export interface DuelOpening {
  player: AuraPool
  hunter: AuraPool
  spaceId?: string | null
  seed?: number
}

export function initialDuelState(opening: DuelOpening = defaultOpening()): DuelState {
  return {
    player: initialDuelist(opening.player),
    hunter: initialDuelist(opening.hunter),
    clock: 0,
    spaceId: opening.spaceId ?? null,
    breaking: 0,
    outcome: 'playing',
    rng: seedRng(opening.seed ?? 0xd0e1),
  }
}

function defaultOpening(): DuelOpening {
  return { player: poolOf(100), hunter: poolOf(100) }
}

export function isHeld(duelist: DuelistState): boolean {
  return duelist.held > 0
}
