import { addPersistentNenEffect } from './effects'
import { strike } from './exchange'
import { distance, normalise, replace } from './fighter'
import {
  otherSide,
  type BodyZone,
  type CombatSide,
  type CombatState,
  type FighterState,
} from './types'

export interface NamedHatsuCast {
  side: CombatSide
  zone: BodyZone
  hatsuId: string | undefined
  paid: FighterState
}

interface NamedHatsuContext extends NamedHatsuCast {
  state: CombatState
  rivalSide: CombatSide
  rival: FighterState
  gap: number
  self: (changes: Partial<FighterState>) => CombatState
  target: (changes: Partial<FighterState>, own?: Partial<FighterState>) => CombatState
  hit: (power: number, range: number) => CombatState
}

type NamedHatsuHandler = (context: NamedHatsuContext) => CombatState

function contextFor(state: CombatState, cast: NamedHatsuCast): NamedHatsuContext {
  const rivalSide = otherSide(cast.side)
  const rival = state[rivalSide]
  const self = (changes: Partial<FighterState>) =>
    replace(state, cast.side, { ...cast.paid, ...changes })
  const target = (changes: Partial<FighterState>, own: Partial<FighterState> = {}) =>
    replace(self(own), rivalSide, { ...rival, ...changes })
  const hit = (power: number, range: number) =>
    strike({ state, side: cast.side, zone: cast.zone, technique: 'hatsu', power, range })
  return {
    ...cast,
    state,
    rivalSide,
    rival,
    gap: distance(cast.paid.position, rival.position),
    self,
    target,
    hit,
  }
}

function biohazard(context: NamedHatsuContext): CombatState {
  return addPersistentNenEffect(
    context.target({ bound: Math.max(context.rival.bound, 1.2) }, { empowered: 4, cooldown: 0.7 }),
    {
      id: `biohazard-${context.side}`,
      kind: 'TRANSFORMED_OBJECT',
      owner: context.side,
      target: context.rivalSide,
      sourceHatsuId: context.hatsuId!,
      remaining: null,
      detail: context.state.terrain.id,
    },
  )
}

function predator(context: NamedHatsuContext): CombatState {
  return context.target(
    { empowered: 0, in: false, ken: false, cooldown: 2 },
    { mode: 'zetsu', empowered: 7 },
  )
}

function parallelFuture(context: NamedHatsuContext): CombatState {
  const away = normalise([
    context.paid.position[0] - context.rival.position[0],
    context.paid.position[1] - context.rival.position[1],
  ])
  return context.self({
    position: [context.paid.position[0] + away[0] * 1.8, context.paid.position[1] + away[1] * 1.8],
    mode: 'zetsu',
    empowered: 3,
    cooldown: 0.35,
  })
}

function catsName(context: NamedHatsuContext): CombatState {
  if (context.paid.condition !== 'down' && context.paid.aura > context.paid.capacity * 0.2)
    return context.state
  return context.target(
    { condition: 'ko', recovery: 0 },
    { aura: context.paid.capacity, condition: 'ready', recovery: 0, cooldown: 3 },
  )
}

function benjaminBaton(context: NamedHatsuContext): CombatState {
  const inherited = (context.paid.hatsuSequence?.count ?? 0) % 3
  return context.self({
    hatsuSequence: {
      id: context.hatsuId!,
      count: inherited + 1,
      lastAt: context.state.clock,
    },
    empowered: 4 + inherited * 2,
    ken: inherited === 1,
    gyo: inherited === 2,
    cooldown: 0.6,
  })
}

function contagion(context: NamedHatsuContext): CombatState {
  const level = Math.min(20, (context.paid.hatsuSequence?.count ?? 0) + 1)
  return context.self({
    hatsuSequence: { id: context.hatsuId!, count: level, lastAt: context.state.clock },
    empowered: Math.max(2, level / 2),
    cooldown: 0.4,
  })
}

function bloodyMary(context: NamedHatsuContext): CombatState {
  if (context.gap > 10) return context.state
  return context.target(
    { bound: 2.4, in: false },
    { aura: Math.max(0, context.paid.aura - 4), gyo: true, cooldown: 1 },
  )
}

function bodyAndSoul(context: NamedHatsuContext): CombatState {
  return context.gap > 2.8
    ? context.state
    : context.target({ in: false, feint: null }, { gyo: true, cooldown: 0.5 })
}

function damageSweetHome(context: NamedHatsuContext): CombatState {
  return context.self({
    ken: true,
    aura: Math.min(context.paid.capacity, context.paid.aura + 18),
    recoveryWindow: 4,
    cooldown: 1.4,
  })
}

function lsdf(context: NamedHatsuContext): CombatState {
  return context.gap > 8
    ? context.state
    : context.target({ bound: 3, movement: [0, 0], intent: null }, { cooldown: 1.8 })
}

function luini(context: NamedHatsuContext): CombatState {
  const direction = normalise([
    context.rival.position[0] - context.paid.position[0],
    context.rival.position[1] - context.paid.position[1],
  ])
  return context.self({
    position: [
      context.rival.position[0] + direction[1] * 1.2,
      context.rival.position[1] - direction[0] * 1.2,
    ],
    cooldown: 0.7,
  })
}

function silentMajority(context: NamedHatsuContext): CombatState {
  if (context.rival.gyo) return context.hit(0.7, 8)
  return addPersistentNenEffect(
    context.target(
      { bound: 1.5, aura: Math.max(0, context.rival.aura - 18) },
      { in: true, cooldown: 1.4 },
    ),
    {
      id: `silent-majority-${context.side}`,
      kind: 'HIDDEN_TRAP',
      owner: context.side,
      target: context.rivalSide,
      sourceHatsuId: context.hatsuId!,
      remaining: 6,
      detail: null,
    },
  )
}

function stealChain(context: NamedHatsuContext): CombatState {
  if (context.gap > 3.2) return context.state
  return addPersistentNenEffect(
    context.target(
      { aura: Math.max(0, context.rival.aura - 24), mode: 'zetsu', empowered: 0 },
      { aura: Math.min(context.paid.capacity, context.paid.aura + 12), cooldown: 1.5 },
    ),
    {
      id: `steal-chain-${context.side}`,
      kind: 'CAPTURED_ABILITY',
      owner: context.side,
      target: context.rivalSide,
      sourceHatsuId: context.hatsuId!,
      remaining: null,
      detail: context.state.lastHatsuBySide[context.rivalSide],
    },
  )
}

function skillHunter(context: NamedHatsuContext): CombatState {
  const page = (context.paid.hatsuSequence?.count ?? 0) % 3
  return context.self({
    hatsuSequence: { id: context.hatsuId!, count: page + 1, lastAt: context.state.clock },
    empowered: page === 0 ? 5 : 2,
    in: page === 1,
    ken: page === 2,
    cooldown: 0.8,
  })
}

function nenStitches(context: NamedHatsuContext): CombatState {
  return context.paid.condition === 'ready'
    ? context.target({ bound: 2.2 }, { cooldown: 0.9 })
    : context.self({ condition: 'ready', recovery: 0, cooldown: 1.6 })
}

function illumiNeedlePeople(context: NamedHatsuContext): CombatState {
  if (context.gap > 3) return context.state
  return context.target(
    {
      bound: 4,
      movement: normalise([
        context.paid.position[0] - context.rival.position[0],
        context.paid.position[1] - context.rival.position[1],
      ]),
      intent: null,
    },
    { cooldown: 2 },
  )
}

function chainJail(context: NamedHatsuContext): CombatState {
  if (context.gap > 5) return context.state
  return context.target(
    { bound: 3.5, mode: 'zetsu', movement: [0, 0], intent: null },
    { cooldown: 1.8 },
  )
}

function enchantingMusic(context: NamedHatsuContext): CombatState {
  if (context.gap > 9) return context.state
  return context.target(
    { intent: null, empowered: 0, cooldown: Math.max(1.5, context.rival.cooldown) },
    { ken: true, recoveryWindow: 3, cooldown: 1.2 },
  )
}

function snakeArm(context: NamedHatsuContext): CombatState {
  if (context.gap > 5) return context.state
  return context.target(
    { bound: 2.8, movement: [0, 0], aura: Math.max(0, context.rival.aura - 8) },
    { cooldown: 1.3 },
  )
}

function crossGame(context: NamedHatsuContext): CombatState {
  const warned = context.paid.hatsuSequence?.id === context.hatsuId
  if (!warned) {
    return context.self({
      hatsuSequence: { id: context.hatsuId!, count: 1, lastAt: context.state.clock },
      cooldown: 0.25,
    })
  }
  if (context.gap > 8) return context.state
  return context.target(
    { bound: 3, movement: [0, 0], intent: null },
    { hatsuSequence: null, cooldown: 1.2 },
  )
}

const NAMED_HATSU_HANDLERS: Record<string, NamedHatsuHandler> = {
  'biohazard-hinrigh': biohazard,
  'rihan-predator': predator,
  'parallel-future': parallelFuture,
  'cats-name': catsName,
  'benjamin-baton': benjaminBaton,
  contagion,
  'bloody-mary': bloodyMary,
  'body-and-soul': bodyAndSoul,
  'damage-sweet-home': damageSweetHome,
  lsdf,
  'luini-spatial-teleportation': luini,
  'secret-window': (context) => context.self({ gyo: true, empowered: 2, cooldown: 0.4 }),
  erigeron: (context) =>
    context.self({
      aura: Math.min(context.paid.capacity, context.paid.aura + 24),
      empowered: 2,
      cooldown: 1.8,
    }),
  'hanzo-skill-4': (context) =>
    context.self({ in: true, empowered: 4, movement: [0, 0], cooldown: 1 }),
  'magical-esthetician-cookie': (context) =>
    context.self({
      aura: context.paid.capacity,
      condition: 'ready',
      recovery: 0,
      bound: 0,
      cooldown: 4,
    }),
  'silent-majority': silentMajority,
  'steal-chain': stealChain,
  'stealth-dolphin': (context) =>
    context.self({
      empowered: 6,
      gyo: true,
      hatsuSequence: { id: context.hatsuId!, count: 1, lastAt: context.state.clock },
      cooldown: 1,
    }),
  'holy-chain': (context) =>
    context.self({
      aura: Math.min(context.paid.capacity, context.paid.aura + 36),
      condition: 'ready',
      recovery: 0,
      cooldown: 2.5,
    }),
  'skill-hunter': skillHunter,
  'pain-packer': (context) =>
    context.hit(1.2 + (1 - context.paid.aura / context.paid.capacity) * 2.4, 6),
  // The carried Hatsu panel can manifest Blinky, but suction needs an explicit
  // non-living scene target and therefore belongs to FIGHTING_MOVE.
  blinky: (context) => context.self({ cooldown: 0.25 }),
  'nen-stitches': nenStitches,
  'illumi-needle-people': illumiNeedlePeople,
  'emperor-time': (context) =>
    context.self({ empowered: 8, ken: true, gyo: true, recoveryWindow: 4, cooldown: 1.2 }),
  'chain-jail': chainJail,
  'melody-enchanting-music': enchantingMusic,
  'dance-of-the-serpents-bite': (context) => context.hit(1.05, 8),
  'padaille-weapon-transformation': (context) => context.hit(1.75, 3),
  'snake-arm': snakeArm,
  'grimmel-the-dissonance': (context) => context.hit(2.8, 12),
  'cross-game': crossGame,
}

/** Resolves contracts whose duel behavior is more specific than their broad effect family. */
export function resolveNamedHatsu(state: CombatState, cast: NamedHatsuCast): CombatState | null {
  if (!cast.hatsuId) return null
  const handler = NAMED_HATSU_HANDLERS[cast.hatsuId]
  return handler ? handler(contextFor(state, cast)) : null
}
