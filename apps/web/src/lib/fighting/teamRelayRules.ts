import { createFightState } from './fightState'
import { canMove } from './fightActorState'
import { motionOf } from './fighterMovement'
import { replayChecksum } from './clashReplayCodec'
import type { ArcadeFighter, FightSide, FightState } from './types'

// Body bookkeeping, inert speech history and uncast clause choices may differ off stage.
// All other fields must match the resting character: no clock, loan, seal or Hatsu is suspended.
const BODY_FIELDS = new Set([
  'personalEncounters',
  'dowsingScreened',
  'heardWords',
  'dowsingReading',
  'devicePlayback',
  'receiverReading',
  'judgmentPreset',
  'judgmentDeclaration',
  'x',
  'y',
  'velocityY',
  'facing',
  'health',
  'maxHealth',
  'aura',
  'auraExhausted',
  'pose',
  'motion',
  'hitStun',
  'blockStun',
  'knockdownFrames',
  'wakeupInvulnerableFrames',
  'reversalWindow',
  'comboHits',
  'comboDamage',
  'juggleCount',
  'guardFrames',
  'ryuWindow',
  'attack',
  'bufferedAttack',
  'throwTechFrames',
  'throwTechRecoveryFrames',
  'crouching',
  'blocking',
])
function restingNen(actor: ArcadeFighter): boolean {
  const base = createFightState(actor.id, actor.id).player
  const special = (value: ArcadeFighter) =>
    restingValue(Object.fromEntries(Object.entries(value).filter(([key]) => !BODY_FIELDS.has(key))))
  return replayChecksum(special(actor)) === replayChecksum(special(base))
}
function restingValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(restingValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, v]) => v !== undefined && v !== null && v !== false && v !== 0)
      .map(([key, v]) => [key, restingValue(v)]),
  )
}
function quietWorld(state: FightState): boolean {
  return (
    ![
      state.parallelFuture,
      state.catsName,
      state.moonlight,
      state.bungeeGum,
      state.lsdf,
      state.voconteDoors,
      state.expulsion,
    ].some(Boolean) &&
    state.projectiles.length === 0 &&
    !state.battlefield?.entities.some((entry) => entry.device?.form || entry.device?.transforming)
  )
}
export function teamRelayReady(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  if (!relayBodyFree(actor)) return false
  const target = state[side === 'player' ? 'opponent' : 'player']
  const links = [
    target.chainJail,
    target.drainingChain,
    target.judgmentChain,
    target.machiThread,
    target.needlePuppet,
    target.maryCapture,
    target.biohazardRestraint,
  ]
  return quietWorld(state) && restingNen(actor) && !links.some(Boolean)
}
function relayBodyFree(actor: ArcadeFighter) {
  const motion = motionOf(actor)
  return (
    canMove(actor) &&
    actor.y === 0 &&
    ![
      actor.bufferedAttack,
      actor.blocking,
      motion.dash,
      motion.prejumpFrames,
      motion.landingFrames,
      actor.wakeupInvulnerableFrames,
      actor.reversalWindow,
      actor.throwTechRecoveryFrames,
    ].some(Boolean)
  )
}
export function atTeamGate(state: FightState, side: FightSide): boolean {
  return side === 'player' ? state[side].x <= 10 : state[side].x >= 90
}
export function teamEntry(actor: ArcadeFighter, side: FightSide): ArcadeFighter {
  return {
    ...structuredClone(actor),
    x: side === 'player' ? 7 : 93,
    y: 0,
    velocityY: 0,
    facing: side === 'player' ? 1 : -1,
    pose: 'idle',
    motion: undefined,
    bufferedAttack: null,
    blocking: false,
    guardFrames: 0,
  }
}
