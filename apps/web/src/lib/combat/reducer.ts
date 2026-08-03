import {
  advanceTethers,
  chargeKo,
  evade,
  landReadyIntent,
  landReadyKo,
  prepareStrike,
  ringOut,
  strike,
} from './exchange'
import {
  activeGuard,
  advanceFighter,
  distance,
  feint,
  normalise,
  replace,
  setKen,
  setMode,
  setMovement,
  setRyu,
  syncPosition,
  toggle,
} from './fighter'
// Re-exported: the constants describe the arena's economy, and callers have
// always read them from here.
export {
  EVADE_COST,
  EVADE_DISTANCE,
  FEINT_COST,
  GUARD_WINDOW,
  GYO_PER_SECOND,
  HATSU_COST,
  IN_PER_SECOND,
  KEN_PER_SECOND,
  KO_COST,
  KO_WINDUP,
  MIN_SEPARATION,
  MOVE_SPEED,
  REN_PER_SECOND,
  RYU_SHIFT_TIME,
  SCORE_TO_WIN,
  STRIKE_WINDUP,
  ZETSU_RECOVERY,
} from './fighter'
import { HATSU_COST } from './fighter'
import type { Vec2 } from '../tour/types'
import {
  initialCombatState,
  otherSide,
  type ArenaHatsuEffect,
  type BodyZone,
  type CombatAction,
  type CombatSide,
  type CombatState,
  type FighterState,
} from './types'

export function combatReducer(state: CombatState, action: CombatAction): CombatState {
  if (state.outcome !== 'playing') return state
  if (action.type === 'TICK') return tick(state, action.dt)
  if (action.type === 'SYNC_POSITION')
    return replace(state, action.side, syncPosition(state[action.side], action.position))
  if (action.type === 'FACE')
    return replace(state, action.side, { ...state[action.side], facing: action.heading })
  if (action.type === 'EVADE') return evade(state, action.side, action.vector)
  if (action.type === 'MOVE')
    return replace(state, action.side, setMovement(state[action.side], action.vector))
  if (action.type === 'MODE')
    return replace(state, action.side, setMode(state[action.side], action.mode))
  if (action.type === 'RYU') return replace(state, action.side, setRyu(state[action.side], action))
  if (action.type === 'GYO')
    return replace(state, action.side, toggle(state[action.side], 'gyo', action.on))
  if (action.type === 'IN')
    return replace(state, action.side, toggle(state[action.side], 'in', action.on))
  if (action.type === 'KEN')
    return replace(state, action.side, setKen(state[action.side], action.on))
  if (action.type === 'GUARD') return replace(state, action.side, activeGuard(state[action.side]))
  if (action.type === 'FEINT')
    return replace(state, action.side, feint(state[action.side], action.zone))
  if (action.type === 'PREPARE_STRIKE') return prepareStrike(state, action.side, action.zone)
  if (action.type === 'HATSU') return castHatsu(state, action)
  if (action.type === 'STRIKE') {
    return strike({ state, side: action.side, zone: action.zone, technique: 'strike' })
  }
  if (action.type === 'KO') return chargeKo(state, action.side, action.zone)
  return state
}

export { initialCombatState }

function tick(state: CombatState, dt: number): CombatState {
  const context = { dt, state }
  const advanced: CombatState = {
    ...state,
    clock: state.clock + dt,
    player: advanceFighter(state.player, state.opponent, context),
    opponent: advanceFighter(state.opponent, state.player, context),
  }
  return ringOut(landReadyKo(landReadyIntent(advanceTethers(advanced, dt))))
}

/** The whole of a HATSU action, which is what `castHatsu` reads anyway. */
interface HatsuCast {
  side: CombatSide
  effect: ArenaHatsuEffect
  zone: BodyZone
  hatsuId?: string
  targetAt?: Vec2
  cost?: number
}

function castHatsu(
  state: CombatState,
  { side, effect, zone, hatsuId, targetAt, cost: requestedCost }: HatsuCast,
): CombatState {
  const fighter = state[side]
  const sequenceCost =
    requestedCost ??
    (hatsuId === 'ripper-cyclotron' || hatsuId === 'battle-cantabile-jupiter' ? 6 : HATSU_COST)
  if (
    (fighter.condition !== 'ready' && hatsuId !== 'cats-name') ||
    fighter.cooldown > 0 ||
    fighter.aura < sequenceCost
  )
    return state
  const paid = { ...fighter, aura: fighter.aura - sequenceCost, intent: null }
  let current = replace(state, side, paid)
  const rivalSide = otherSide(side)

  if (hatsuId === 'ripper-cyclotron' || hatsuId === 'battle-cantabile-jupiter') {
    const previous = fighter.hatsuSequence
    const continuous = previous?.id === hatsuId && state.clock - previous.lastAt <= 1.2
    const count = continuous ? previous.count + 1 : 1
    if (count < 3) {
      return replace(current, side, {
        ...paid,
        hatsuSequence: { id: hatsuId, count, lastAt: state.clock },
        cooldown: 0.2,
      })
    }
    current = replace(current, side, { ...paid, hatsuSequence: null })
    return strike({
      state: current,
      side,
      zone,
      technique: 'hatsu',
      power: hatsuId === 'ripper-cyclotron' ? 2.2 : 1.9,
      range: hatsuId === 'ripper-cyclotron' ? 2.4 : 4.5,
    })
  }

  if (hatsuId === 'double-machine-gun') {
    return strike({ state: current, side, zone, technique: 'hatsu', power: 0.95, range: 9 })
  }

  if (hatsuId === 'bungee-gum') {
    const anchor = targetAt ?? state[rivalSide].position
    const subject = targetAt ? side : rivalSide
    const gap = distance(state[subject].position, anchor)
    if (gap > 10) return state
    return {
      ...replace(current, side, { ...paid, cooldown: 0.8 }),
      tethers: [
        ...state.tethers.filter((tether) => tether.owner !== side),
        {
          id: `bungee-${side}`,
          owner: side,
          subject,
          anchor: targetAt ?? null,
          restLength: Math.max(0.8, gap * 0.6),
          remaining: 8,
        },
      ],
    }
  }

  const specialized = blackWhaleHatsu(current, { side, zone, hatsuId, paid })
  if (specialized) return specialized

  if (effect === 'bind') {
    if (distance(fighter.position, state[rivalSide].position) > 7) return state
    current = replace(current, side, { ...paid, cooldown: 1.1 })
    return replace(current, rivalSide, {
      ...current[rivalSide],
      bound: 1.6,
      movement: [0, 0],
      intent: null,
    })
  }
  if (effect === 'restore') {
    return replace(current, side, {
      ...paid,
      aura: Math.min(paid.capacity, paid.aura + 42),
      condition: 'ready',
      recovery: 0,
      cooldown: 2.2,
    })
  }
  if (effect === 'enhance') {
    return replace(current, side, { ...paid, empowered: 5, cooldown: 0.8 })
  }
  return strike({
    state: current,
    side,
    zone,
    technique: 'hatsu',
    power: effect === 'impact' ? 1.65 : 0.82,
    range: effect === 'barrage' ? 9 : 2.7,
  })
}

/** The named contracts, resolved after the cost has already been taken. */
interface BlackWhaleCast {
  side: CombatSide
  zone: BodyZone
  hatsuId: string | undefined
  paid: FighterState
}

function blackWhaleHatsu(
  state: CombatState,
  { side, zone, hatsuId, paid }: BlackWhaleCast,
): CombatState | null {
  if (!hatsuId) return null
  const rivalSide = otherSide(side)
  const rival = state[rivalSide]
  const gap = distance(paid.position, rival.position)
  const self = (changes: Partial<FighterState>) => replace(state, side, { ...paid, ...changes })
  const target = (changes: Partial<FighterState>, own: Partial<FighterState> = {}) =>
    replace(self(own), rivalSide, { ...rival, ...changes })
  const hit = (power: number, range: number) =>
    strike({ state, side, zone, technique: 'hatsu', power, range })

  switch (hatsuId) {
    case 'biohazard-hinrigh':
      return target({ bound: Math.max(rival.bound, 1.2) }, { empowered: 4, cooldown: 0.7 })
    case 'rihan-predator':
      return target(
        { empowered: 0, in: false, ken: false, cooldown: 2 },
        { mode: 'zetsu', empowered: 7 },
      )
    case 'parallel-future': {
      const away = normalise([
        paid.position[0] - rival.position[0],
        paid.position[1] - rival.position[1],
      ])
      return self({
        position: [paid.position[0] + away[0] * 1.8, paid.position[1] + away[1] * 1.8],
        mode: 'zetsu',
        empowered: 3,
        cooldown: 0.35,
      })
    }
    case 'cats-name':
      if (paid.condition !== 'down' && paid.aura > paid.capacity * 0.2) return state
      return target(
        { condition: 'ko', recovery: 0 },
        { aura: paid.capacity, condition: 'ready', recovery: 0, cooldown: 3 },
      )
    case 'benjamin-baton': {
      const inherited = (paid.hatsuSequence?.count ?? 0) % 3
      return self({
        hatsuSequence: { id: hatsuId, count: inherited + 1, lastAt: state.clock },
        empowered: 4 + inherited * 2,
        ken: inherited === 1,
        gyo: inherited === 2,
        cooldown: 0.6,
      })
    }
    case 'contagion': {
      const level = Math.min(20, (paid.hatsuSequence?.count ?? 0) + 1)
      return self({
        hatsuSequence: { id: hatsuId, count: level, lastAt: state.clock },
        empowered: Math.max(2, level / 2),
        cooldown: 0.4,
      })
    }
    case 'bloody-mary':
      return gap > 10
        ? state
        : target(
            { bound: 2.4, in: false },
            { aura: Math.max(0, paid.aura - 4), gyo: true, cooldown: 1 },
          )
    case 'body-and-soul':
      return gap > 2.8 ? state : target({ in: false, feint: null }, { gyo: true, cooldown: 0.5 })
    case 'damage-sweet-home':
      return self({
        ken: true,
        aura: Math.min(paid.capacity, paid.aura + 18),
        recoveryWindow: 4,
        cooldown: 1.4,
      })
    case 'lsdf':
      return gap > 8
        ? state
        : target({ bound: 3, movement: [0, 0], intent: null }, { cooldown: 1.8 })
    case 'luini-spatial-teleportation': {
      const direction = normalise([
        rival.position[0] - paid.position[0],
        rival.position[1] - paid.position[1],
      ])
      return self({
        position: [rival.position[0] + direction[1] * 1.2, rival.position[1] - direction[0] * 1.2],
        cooldown: 0.7,
      })
    }
    case 'secret-window':
      return self({ gyo: true, empowered: 2, cooldown: 0.4 })
    case 'erigeron':
      return self({ aura: Math.min(paid.capacity, paid.aura + 24), empowered: 2, cooldown: 1.8 })
    case 'hanzo-skill-4':
      return self({ in: true, empowered: 4, movement: [0, 0], cooldown: 1 })
    case 'magical-esthetician-cookie':
      return self({ aura: paid.capacity, condition: 'ready', recovery: 0, bound: 0, cooldown: 4 })
    case 'silent-majority':
      return rival.gyo
        ? hit(0.7, 8)
        : target({ bound: 1.5, aura: Math.max(0, rival.aura - 18) }, { in: true, cooldown: 1.4 })
    case 'steal-chain':
      return gap > 3.2
        ? state
        : target(
            { aura: Math.max(0, rival.aura - 24), mode: 'zetsu', empowered: 0 },
            { aura: Math.min(paid.capacity, paid.aura + 12), cooldown: 1.5 },
          )
    case 'stealth-dolphin':
      return self({
        empowered: 6,
        gyo: true,
        hatsuSequence: { id: hatsuId, count: 1, lastAt: state.clock },
        cooldown: 1,
      })
    case 'holy-chain':
      return self({
        aura: Math.min(paid.capacity, paid.aura + 36),
        condition: 'ready',
        recovery: 0,
        cooldown: 2.5,
      })
    case 'skill-hunter': {
      const page = (paid.hatsuSequence?.count ?? 0) % 3
      return self({
        hatsuSequence: { id: hatsuId, count: page + 1, lastAt: state.clock },
        empowered: page === 0 ? 5 : 2,
        in: page === 1,
        ken: page === 2,
        cooldown: 0.8,
      })
    }
    case 'pain-packer':
      return hit(1.2 + (1 - paid.aura / paid.capacity) * 2.4, 6)
    case 'blinky':
      return gap > 7
        ? state
        : target({ empowered: 0, bound: 1, aura: Math.max(0, rival.aura - 12) }, { cooldown: 1.2 })
    case 'nen-stitches':
      return paid.condition === 'ready'
        ? target({ bound: 2.2 }, { cooldown: 0.9 })
        : self({ condition: 'ready', recovery: 0, cooldown: 1.6 })
    case 'illumi-needle-people':
      return gap > 3
        ? state
        : target(
            {
              bound: 4,
              movement: normalise([
                paid.position[0] - rival.position[0],
                paid.position[1] - rival.position[1],
              ]),
              intent: null,
            },
            { cooldown: 2 },
          )
    default:
      return null
  }
}
