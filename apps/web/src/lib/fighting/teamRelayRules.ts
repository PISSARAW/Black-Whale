import { teamWorldEngaged } from './teams/commitments'
import { anyPaperTextureBusy } from './paperTexture'
import { illumiRelaySignature } from './illumiDisguiseClock'
import { anyCopiedNeedleFaceBusy } from './illumiNeedleFaceClock'
import { createFightState } from './fightState'
import { canMove } from './fightActorState'
import { motionOf } from './fighterMovement'
import { replayChecksum } from './clashReplayCodec'
import type { ArcadeFighter, FightSide, FightState } from './types'

// Body bookkeeping, inert speech history and uncast clause choices may differ off stage.
// All other fields must match the resting character: no clock, loan, seal or Hatsu is suspended.
const BODY_FIELDS = new Set([
  'secretWindow',
  'kallutoPaper',
  'paperKit',
  'plantedPaper',
  'pressureRead',
  'blackVoiceScreen',
  'stolenChainAbility',
  'blackVoiceGear',
  'equipment',
  'equipmentProps',
  'melodyFlute',
  'writingKit',
  'bashoWard',
  'personalEncounters',
  'dowsingScreened',
  'heardWords',
  'speechPulse',
  'dowsingReading',
  'dowsingAcquaintances',
  'dowsingMapReading',
  'devicePlayback',
  'receiverReading',
  'judgmentPreset',
  'judgmentDeclaration',
  'x',
  'y',
  'velocityY',
  'facing',
  'health',
  'openWounds',
  'bodyDamage',
  'gumProsthesisGeneration',
  'textureTarget',
  'illumiDisguisePlan',
  'illumiNeedleMode',
  'illumiNeedleGeneration',
  'illumiDisguisePins',
  'texturePaperDraft',
  'texturePaperId',
  'paperTextureGeneration',
  'documentReading',
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
  'attackDrive',
  'bufferedAttack',
  'throwTechFrames',
  'throwTechRecoveryFrames',
  'crouching',
  'blocking',
])
const RESTING_NEN = new Map<string, string>()
function restingNen(actor: ArcadeFighter): boolean {
  let baseline = RESTING_NEN.get(actor.id)
  if (baseline === undefined) {
    baseline = restingSignature(createFightState(actor.id, actor.id).player)
    RESTING_NEN.set(actor.id, baseline)
  }
  return restingSignature(actor) === baseline
}
function restingSignature(actor: ArcadeFighter) {
  const values = Object.fromEntries(
    Object.entries(restingBody(relayDolphinState(actor))).filter(([key]) => !BODY_FIELDS.has(key)),
  )
  return replayChecksum(restingValue(values))
}
function restingBody(actor: ArcadeFighter): ArcadeFighter {
  const body = {
    ...actor,
    illumi: illumiRelaySignature(actor),
    on: actor.on?.sealFrames ? { grudge: 0, sealFrames: actor.on.sealFrames } : undefined,
    hatsuEffects: {
      ...actor.hatsuEffects,
      baton: restingWindowBaton(actor.hatsuEffects.baton),
      witnessedHatsu: null,
      witnessedAt: undefined,
      witnessedMoveId: undefined,
    },
  }
  return actor.kurapika ? { ...body, kurapika: { ...actor.kurapika, lifespanFrames: 0 } } : body
}

function restingWindowBaton(baton: ArcadeFighter['hatsuEffects']['baton']) {
  return baton ? { ...baton, markedTarget: null, musseArchive: undefined } : baton
}
function relayDolphinState(actor: ArcadeFighter): ArcadeFighter {
  const chain = actor.kurapika
  let next = actor
  if (actor.dolphinLoan && !actor.dolphinLoan.held.used) next = { ...next, dolphinLoan: undefined }
  if (!chain) return next
  const normalized = { ...chain, lifespanFrames: 0 }
  if (chain.dolphinLoans?.length && !chain.held?.loaded) {
    normalized.emperorTime = false
    normalized.continuousFrames = 0
    normalized.dolphinLoans = undefined
    normalized.held = null
  }
  return { ...next, kurapika: normalized }
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
      state.rosterGuests?.some((guest) => guest.phase !== 'eliminated'),
      state.parallelFuture,
      state.forecastSimulation,
      state.catsName,
      state.gumResuscitation,
      state.moonlight,
      state.bungeeGum,
      gumBusy(state),
      anyPaperTextureBusy(state),
      anyCopiedNeedleFaceBusy(state),
      state.lsdf,
      state.voconteDoors,
      state.expulsion,
      wardBusy(state.player),
      wardBusy(state.opponent),
    ].some(Boolean) &&
    state.projectiles.length === 0 &&
    !state.battlefield?.entities.some(
      (entry) =>
        entry.device?.form || entry.device?.transforming || entry.blackVoiceControl?.active,
    )
  )
}
export function teamRelayBlock(state: FightState, side: FightSide): 'body' | 'commitment' | null {
  const actor = state[side]
  if (!relayBodyFree(actor)) return 'body'
  const target = state[side === 'player' ? 'opponent' : 'player']
  const links = [
    target.blackVoiceControl?.active,
    target.blackVoiceControl?.active,
    target.chainJail,
    target.drainingChain,
    target.judgmentChain,
    target.machiThread,
    target.needlePuppet,
    target.maryCapture,
    target.biohazardRestraint,
  ]
  return quietWorld(state) &&
    restingNen(actor) &&
    !links.some(Boolean) &&
    !teamWorldEngaged(state, side)
    ? null
    : 'commitment'
}
export const teamRelayReady = (state: FightState, side: FightSide) =>
  teamRelayBlock(state, side) === null
function relayBodyFree(actor: ArcadeFighter) {
  const motion = motionOf(actor)
  return (
    canMove(actor) &&
    (actor.bashoWard?.remainingFrames ?? 0) === 0 &&
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

function gumBusy(state: FightState) {
  return (
    state.gumNetwork?.links.length ||
    state.gumNetwork?.pending.player ||
    state.gumNetwork?.pending.opponent
  )
}
function wardBusy(actor: FightState['player']) {
  return (actor.bashoWard?.remainingFrames ?? 0) > 0
}
