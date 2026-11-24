import { voluntaryNenAvailable } from './nenAccess'
import { forceZetsu } from './nen'
import type { ArcadeFighter, FightInput, FightSide, FightState } from './types'

export const BURST_ZETSU_FRAMES = 120
export const BURST_RECOIL_FRAMES = 24
export const BURST_RADIUS = 18
export const BURST_PUSH = 9

type BurstInputs = { player: FightInput; opponent?: FightInput }

export function canBurst(fighter: ArcadeFighter, available = true): boolean {
  return (
    available &&
    fighter.hitStun > 0 &&
    fighter.comboHits > 0 &&
    voluntaryNenAvailable(fighter, { requireReserve: true, requireHatsu: false })
  )
}

/** Resolve both seats from the same pre-Burst state, in stable seat order. */
export function resolveBurstInputs(state: FightState, inputs: BurstInputs): FightState {
  const requested = (['player', 'opponent'] as const).filter((side) => {
    if (!canBurst(state[side], state.burstAvailable?.[side] !== false)) return false
    if (side === 'player') return Boolean(inputs.player.burst)
    return inputs.opponent
      ? Boolean(inputs.opponent.burst)
      : state.mode === 'versus-ai' && shouldAiBurst(state.opponent)
  })
  return requested.reduce((next, side) => activateBurst(next, side), state)
}

/** Decrement after the frame so the full frame remains in forced Zetsu. */
export function advanceBurstZetsu(state: FightState, activationFrame: number): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const fighter = next[side]
    const frames = fighter.burstZetsuFrames ?? 0
    if (frames <= 0 || (state.burst?.frame === activationFrame && frames === BURST_ZETSU_FRAMES))
      continue
    next = {
      ...next,
      [side]: {
        ...forceZetsu(fighter),
        burstZetsuFrames: frames - 1,
      },
    }
  }
  return next
}

function activateBurst(state: FightState, side: FightSide): FightState {
  const enemySide: FightSide = side === 'player' ? 'opponent' : 'player'
  const fighter = state[side]
  const enemy = state[enemySide]
  const direction = fighter.x <= enemy.x ? 1 : -1
  const nearby = Math.abs(fighter.x - enemy.x) <= BURST_RADIUS
  const released: ArcadeFighter = {
    ...forceZetsu(fighter),
    aura: fighter.aura / 2,
    burstZetsuFrames: BURST_ZETSU_FRAMES,
    hitStun: 0,
    blockStun: 0,
    comboHits: 0,
    comboDamage: 0,
    juggleCount: 0,
    attack: null,
    bufferedAttack: null,
    blocking: false,
    pose: fighter.y > 0 ? 'jump' : 'idle',
  }
  const repelled: ArcadeFighter = nearby
    ? {
        ...enemy,
        x: clamp(enemy.x + direction * BURST_PUSH, 7, 93),
        hitStun: Math.max(enemy.hitStun, BURST_RECOIL_FRAMES),
        attack: null,
        bufferedAttack: null,
        blocking: false,
        pose: 'hit',
      }
    : enemy
  return {
    ...state,
    hitstop: 0,
    burstAvailable: { player: true, opponent: true, ...state.burstAvailable, [side]: false },
    [side]: released,
    [enemySide]: repelled,
    burst: { side, frame: state.frame, sequence: (state.burst?.sequence ?? 0) + 1 },
  }
}

function shouldAiBurst(fighter: ArcadeFighter): boolean {
  return fighter.comboHits >= 3 || fighter.health <= fighter.maxHealth * 0.35
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}
