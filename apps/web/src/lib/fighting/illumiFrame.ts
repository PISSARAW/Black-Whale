import { releasePreparedEntity } from './preparedCorpseBody'
import { advanceCorpseControls } from './illumiCorpses'
import { illumiNenActive } from './illumiAccess'
import { illumiState, type NeedlePuppet } from './illumiState'
import { ILLUMI_UNPINNED_FRAMES } from './illumiDisguiseTuning'
import { withGumChannel } from './bungeeChannel'
import { observeIllumiFace } from './illumiDisguiseWitness'
import type { ArcadeFighter, FightInput, FightSide, FightState } from './types'

export function illumiInput(fighter: ArcadeFighter, input: FightInput): ArcadeFighter {
  const preparation = fighter.illumi?.preparation ?? 0
  if (!preparation || !(input.left || input.right || input.jump || input.guard || input.down))
    return fighter
  return { ...fighter, illumi: { ...illumiState(fighter), preparation: 0, anchor: undefined } }
}

export function advanceIllumi(state: FightState): FightState {
  if (state.phase !== 'fighting') return state
  return advanceCorpseControls(advanceForSide(advanceForSide(state, 'player'), 'opponent'))
}

function advanceForSide(state: FightState, side: FightSide): FightState {
  const origin = state[side].illumi?.disguiseOrigin
  return origin
    ? withGumChannel(state, { ...origin, side }, (scoped) => advanceScopedIllumi(scoped, side))
    : advanceScopedIllumi(state, side)
}

function advanceScopedIllumi(state: FightState, side: FightSide): FightState {
  const fighter = prepareDisguise(state[side], state.frame)
  const observed =
    fighter === state[side]
      ? state
      : observeIllumiFace(
          { ...state, [side]: fighter },
          side,
          Boolean(state[side].illumi?.disguised),
        )
  const puppet = fighter.needlePuppet
  if (!puppet) return observed
  const owner = observed[puppet.owner]
  return { ...observed, [side]: obeyOrder(fighter, owner, puppet) }
}

function prepareDisguise(fighter: ArcadeFighter, frame: number): ArcadeFighter {
  const current = fighter.illumi
  if (!current?.preparation) return fighter
  const interrupted = disguiseInterrupted(fighter)
  if (interrupted) return { ...fighter, illumi: { ...current, preparation: 0, anchor: undefined } }
  const preparation = current.preparation - 1
  return {
    ...fighter,
    pose: 'special',
    illumi: {
      ...current,
      preparation,
      disguised: preparation === 0,
      disguiseExpiresAt:
        preparation === 0 && current.disguiseMode === 'unpinned-hisoka'
          ? frame + 1 + ILLUMI_UNPINNED_FRAMES
          : undefined,
      anchor: preparation ? current.anchor : undefined,
    },
  }
}

function obeyOrder(
  fighter: ArcadeFighter,
  owner: ArcadeFighter,
  puppet: NeedlePuppet,
): ArcadeFighter {
  const body = {
    ...fighter,
    attack: null,
    bufferedAttack: null,
    blocking: false,
    guardFrames: 0,
    hatsuChargeFrames: 0,
    coveringEars: false,
    pluggingWounds: false,
  }
  if (fighter.health <= 0 || fighter.hitStun > 0 || fighter.knockdownFrames > 0) return body
  if (!puppet.needleEmbedded || puppet.order === 'stay') return { ...body, pose: 'idle' }
  const x = orderedPosition(fighter, owner, puppet.order)
  return { ...body, x, pose: x === fighter.x ? 'idle' : 'walk' }
}

export function consumeControlNeedle(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  if (!fighter.needlePuppet) return state
  return {
    ...state,
    [side]: { ...fighter, needlePuppet: { ...fighter.needlePuppet, needleEmbedded: false } },
  }
}

function disguiseInterrupted(fighter: ArcadeFighter): boolean {
  const anchor = fighter.illumi?.anchor
  if (!anchor || !illumiNenActive(fighter)) return true
  return (
    fighter.hitStun > 0 ||
    fighter.knockdownFrames > 0 ||
    fighter.x !== anchor.x ||
    fighter.y !== anchor.y
  )
}

function orderedPosition(
  fighter: ArcadeFighter,
  owner: ArcadeFighter,
  order: NeedlePuppet['order'],
): number {
  const direction = owner.x < fighter.x ? -1 : 1
  const step = order === 'approach' ? direction : -direction
  if (order === 'approach' && Math.abs(owner.x - fighter.x) <= 6) return fighter.x
  return Math.max(7, Math.min(93, fighter.x + step * 0.22))
}

export function releaseIllumiPage(state: FightState, side: FightSide, page: string): FightState {
  const targetSide = side === 'player' ? 'opponent' : 'player'
  if (page !== 'illumi') return state
  state = releaseCorpsePage(state, side)
  if (state[targetSide].needlePuppet?.owner !== side) return state
  return consumeControlNeedle(state, targetSide)
}

export function ownsNeedlePuppet(state: FightState, side: FightSide): boolean {
  const puppet = state[side === 'player' ? 'opponent' : 'player'].needlePuppet
  return puppet?.owner === side && puppet.needleEmbedded
}

function releaseCorpsePage(state: FightState, side: FightSide): FightState {
  if (!state.battlefield) return state
  const entities = state.battlefield.entities.map((entry) =>
    entry.kind === 'corpse' && entry.controller?.side === side
      ? releasePreparedEntity(entry)
      : entry,
  )
  return { ...state, battlefield: { ...state.battlefield, entities } }
}
