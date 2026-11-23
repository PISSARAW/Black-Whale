import { canUseFightHatsu } from '../hatsu'
import { IN_CHARGE_FRAMES } from '../nen'
import { kameoDefinition } from '../kameos/catalogue'
import type { KameoId, KameoSlot } from '../kameos/types'
import type { ArcadeFighter, FightSide, FightState } from '../types'
import type { FightSoundEvent } from './events'

export type TacticalSoundKind =
  | 'burst'
  | 'ko-clash'
  | 'breach'
  | 'assist-entry'
  | 'assist-action'
  | 'assist-exit'
  | 'assist-interrupted'
  | 'assist-ready'
  | 'nen-low'
  | 'nen-empty'
  | 'hatsu-ready'
  | 'charge-ready'
  | 'refused'
  | 'health-low'

export function tacticalSoundEvents(before: FightState, after: FightState, viewer: FightSide) {
  const events = decisiveSounds(before, after)
  for (const side of ['player', 'opponent'] as const) {
    if (after.burstAvailable?.[side] === false && before.burstAvailable?.[side] !== false)
      events.push({ kind: 'burst', side, x: after[side].x })
    events.push(...assistSounds({ before, after }, side, viewer))
  }
  const old = before[viewer]
  const fighter = after[viewer]
  const add = (kind: TacticalSoundKind) => events.push({ kind, side: viewer, x: 50 })
  resourceSounds(old, fighter).forEach(add)
  if (refused({ before, after }, viewer)) add('refused')
  return events
}

function decisiveSounds(before: FightState, after: FightState) {
  const events: FightSoundEvent[] = []
  const { attackClash, stageTransition } = after
  if (attackClash && attackClash.sequence !== before.attackClash?.sequence)
    events.push({ kind: 'ko-clash', x: attackClash.position.x })
  if (stageTransition && stageTransition.sequence !== before.stageTransition?.sequence)
    events.push({ kind: 'breach', x: stageTransition.direction === 'left' ? 8 : 92 })
  return events
}

interface StateChange {
  before: FightState
  after: FightState
}

function assistSounds({ before, after }: StateChange, side: FightSide, viewer: FightSide) {
  const old = before.kameos?.[side]
  const slot = after.kameos?.[side]
  if (!old || !slot || old.fighter.id !== slot.fighter.id) return []
  const events: FightSoundEvent[] = []
  const add = (kind: TacticalSoundKind, x = slot.fighter.x) =>
    events.push({ kind, side, x, source: slot.fighter.id })
  const phase = assistPhaseSound(old, slot, after[side].health)
  if (phase) add(phase)
  if (assistDelivered(old, slot)) add('assist-action')
  if (side === viewer && becameAssistReady(old, slot)) add('assist-ready', 50)
  return events
}

function assistPhaseSound(
  old: KameoSlot,
  slot: KameoSlot,
  leaderHealth: number,
): TacticalSoundKind | null {
  if (old.phase === slot.phase) return null
  if (slot.phase === 'entering' && old.phase === 'reserve') return 'assist-entry'
  if (slot.phase === 'eliminated') return 'assist-interrupted'
  if (slot.phase !== 'leaving') return null
  const interrupted =
    slot.fighter.hitStun > 0 || slot.fighter.knockdownFrames > 0 || leaderHealth <= 0
  return interrupted ? 'assist-interrupted' : 'assist-exit'
}

function assistDelivered(old: KameoSlot, slot: KameoSlot) {
  const { timing } = kameoDefinition(slot.fighter.id as KameoId)
  return (
    slot.phase === 'acting' &&
    old.fighter.aura > slot.fighter.aura &&
    slot.phaseFrames >= timing.startup &&
    (old.phase !== 'acting' || old.phaseFrames < timing.startup)
  )
}

function becameAssistReady(old: KameoSlot, slot: KameoSlot) {
  return !assistReady(old) && assistReady(slot)
}

function assistReady(slot: KameoSlot) {
  const { auraCost } = kameoDefinition(slot.fighter.id as KameoId)
  return (
    slot.phase === 'reserve' &&
    slot.cooldownFrames === 0 &&
    slot.fighter.health > 0 &&
    slot.fighter.aura >= auraCost
  )
}

function resourceSounds(old: ArcadeFighter, fighter: ArcadeFighter) {
  const events: TacticalSoundKind[] = []
  if (!old.auraExhausted && fighter.auraExhausted) events.push('nen-empty')
  else if (old.aura > 20 && fighter.aura <= 20) events.push('nen-low')
  if (!canUseFightHatsu(old) && canUseFightHatsu(fighter)) events.push('hatsu-ready')
  if (old.hatsuChargeFrames < IN_CHARGE_FRAMES && fighter.hatsuChargeFrames >= IN_CHARGE_FRAMES)
    events.push('charge-ready')
  if (lowHealthCrossed(old, fighter)) events.push('health-low')
  return events
}

function lowHealthCrossed(old: ArcadeFighter, fighter: ArcadeFighter) {
  return (
    old.health > old.maxHealth * 0.25 &&
    fighter.health > 0 &&
    fighter.health <= fighter.maxHealth * 0.25
  )
}

function refused({ before, after }: StateChange, side: FightSide) {
  const feedback = after.commandFeedback?.[side]
  return (
    feedback?.outcome === 'refused' &&
    feedback.sequence !== before.commandFeedback?.[side]?.sequence
  )
}
