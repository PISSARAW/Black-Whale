import type { FightSide, FightState, FighterHatsuEffects } from '../types'
import { fighterEvent, type FightSoundEvent } from './events'

/** Sustained techniques announce their actual state transition, including utility moves. */
export function characterSoundEvents(
  before: FightState,
  after: FightState,
  side: FightSide,
): FightSoundEvent[] {
  return [
    ...emperorEvents(before, after, side),
    ...bodyEvents(before, after, side),
    ...bookEvents(before, after, side),
    ...guardEvents(before, after, side),
    ...effectEvents(before, after, side),
    ...gumEvents(before, after, side),
    ...chargeEvents(before, after, side),
  ]
}

function emperorEvents(before: FightState, after: FightState, side: FightSide): FightSoundEvent[] {
  const previous = before[side]
  const fighter = after[side]
  const events: FightSoundEvent[] = []
  const push = (kind: FightSoundEvent['kind'], value?: number) =>
    events.push({ ...fighterEvent(fighter, side, kind), value })
  const emperor = Boolean(fighter.kurapika?.emperorTime)
  if (emperor !== Boolean(previous.kurapika?.emperorTime))
    push(emperor ? 'emperor-on' : 'emperor-off')
  if (
    emperor &&
    lifespanBeat(previous.kurapika?.lifespanFrames) !==
      lifespanBeat(fighter.kurapika?.lifespanFrames)
  ) {
    push('heartbeat', fighter.kurapika?.continuousFrames)
  }
  return events
}

function bodyEvents(before: FightState, after: FightState, side: FightSide): FightSoundEvent[] {
  const previous = before[side]
  const fighter = after[side]
  const transitions: [unknown, unknown, FightSoundEvent['kind']][] = [
    [previous.biscuitTrueForm, fighter.biscuitTrueForm, 'transform'],
    [previous.hanzoProjection, fighter.hanzoProjection, 'projection'],
    [previous.hatsuEffects.painPacker?.armour, fighter.hatsuEffects.painPacker?.armour, 'armour'],
    [previous.hatsuEffects.painPacker?.sun, fighter.hatsuEffects.painPacker?.sun, 'sun'],
    [previous.chainJail, fighter.chainJail, 'seal'],
    [previous.judgmentChain, fighter.judgmentChain, 'seal'],
    [previous.textureSurprise, fighter.textureSurprise, 'page'],
  ]
  return transitions
    .filter(
      ([was, now, kind]) =>
        Boolean(was) !== Boolean(now) && (Boolean(now) || kind === 'projection'),
    )
    .map(([, now, kind]) => ({
      ...fighterEvent(fighter, side, kind),
      value: kind === 'sun' ? fighter.hatsuEffects.painPacker?.sun?.radius : Number(Boolean(now)),
    }))
}

function gumEvents(before: FightState, after: FightState, side: FightSide): FightSoundEvent[] {
  const events: FightSoundEvent[] = []
  if (before.bungeeGum !== after.bungeeGum && after.bungeeGum?.owner === side) {
    const changed =
      before.bungeeGum?.retracting !== after.bungeeGum.retracting ||
      before.bungeeGum?.rebounding !== after.bungeeGum.rebounding
    if (!before.bungeeGum || changed)
      events.push({
        ...fighterEvent(after[side], side, 'gum'),
        value: Number(after.bungeeGum.retracting),
      })
  }
  return events
}

function chargeEvents(before: FightState, after: FightState, side: FightSide): FightSoundEvent[] {
  const fighter = after[side]
  const turns = fighter.hatsuEffects.cyclotronTurns
  if (turns <= before[side].hatsuEffects.cyclotronTurns) return []
  return [{ ...fighterEvent(fighter, side, 'hatsu'), source: 'phinks', value: turns }]
}

const lifespanBeat = (frames = 0) => Math.floor(frames / 60)

function bookEvents(before: FightState, after: FightState, side: FightSide): FightSoundEvent[] {
  const previous = before[side].chrolloBook
  const book = after[side].chrolloBook
  if (!previous || !book) return []
  const changed =
    book.page !== previous.page ||
    book.open !== previous.open ||
    book.bookmark !== previous.bookmark ||
    book.pages.length !== previous.pages.length
  return changed ? [fighterEvent(after[side], side, 'page')] : []
}

function guardEvents(before: FightState, after: FightState, side: FightSide): FightSoundEvent[] {
  const previous = before.lsdf?.[side]
  const guard = after.lsdf?.[side]
  if (!guard) return []
  const changed = !previous || previous.level !== guard.level || previous.phase !== guard.phase
  return changed ? [{ ...fighterEvent(after[side], side, 'lsdf'), value: guard.level }] : []
}

const EFFECT_CUES: Partial<Record<keyof FighterHatsuEffects, string>> = {
  forcedZetsuFrames: 'seal',
  senseSeals: 'gong',
  manipulatedFrames: 'needle',
  stitchedFrames: 'thread',
  needleFrames: 'needle',
  restrainedFrames: 'verdict',
  cantabileFrames: 'dance',
  bloodBoundFrames: 'blood',
  entrancedFrames: 'flute',
  haikuFrames: 'poem',
  venomFrames: 'snake',
  possessedFrames: 'spirit',
  contagionFrames: 'contagion',
  futureSight: 'future',
  blinkyFrames: 'vacuum',
  biohazardFrames: 'machine',
  predatorFrames: 'predator',
  cohortWillFrames: 'arrow',
  isolationFrames: 'portal',
  eyeWogFrames: 'read',
  soulExposedFrames: 'interrogate',
}

function effectEvents(before: FightState, after: FightState, side: FightSide): FightSoundEvent[] {
  const previous = before[side].hatsuEffects
  const fighter = after[side]
  const events: FightSoundEvent[] = []
  for (const [key, cue] of Object.entries(EFFECT_CUES)) {
    const field = key as keyof FighterHatsuEffects
    const was = Number(previous[field])
    const now = Number(fighter.hatsuEffects[field])
    const entered = now > 0 && was <= 0
    const nextSeal = key === 'senseSeals' && now > was
    if (entered || nextSeal)
      events.push({
        ...fighterEvent(fighter, side, cue === 'seal' ? 'seal' : 'effect'),
        moveId: cue,
        value: now,
      })
  }
  return events
}
