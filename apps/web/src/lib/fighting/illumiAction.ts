import { canStartFighterAttack } from './fighterAttacks'
import { illumiAvailable, illumiMove } from './illumiAccess'
import { illumiDisguiseAvailable, clearIllumiFace } from './illumiDisguise'
import { newGumSource } from './bungeeSource'
import { freeDeviceHand } from './deviceHands'
import {
  illumiBodyFree,
  illumiState,
  ILLUMI_DISGUISE_COST,
  ILLUMI_DISGUISE_FRAMES,
  type NeedleOrder,
} from './illumiState'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightSide, FightState } from './types'

/** Only the implantation enters the ordinary attack path. Orders and disguise never strike. */
export function performIllumiAction(options: AuraAttackOptions): FightState | null {
  const { state, side, kind, moveId } = options
  const fighter = state[side]
  if (kind !== 'special' || !illumiMove(fighter, moveId)) return null
  const available =
    moveId === 'illumi:backSpecial' ? illumiDisguiseAvailable(fighter) : illumiAvailable(fighter)
  if (!illumiBodyFree(fighter) || !available || !canIssueCommand(fighter)) return state
  return performCommand(options)
}

function performCommand({ state, side, moveId }: AuraAttackOptions): FightState | null {
  if (moveId === 'illumi:finisher') return state
  if (moveId === 'illumi:forwardSpecial') return giveNeedleOrder(state, side, 'approach')
  if (moveId === 'illumi:downSpecial') return giveNeedleOrder(state, side, 'retreat')
  if (moveId === 'illumi:backSpecial') return disguise(state, side)
  const enemy = side === 'player' ? 'opponent' : 'player'
  if (state[side].illumiNeedleMode !== 'face-warp' && state[enemy].needlePuppet?.owner === side)
    return giveNeedleOrder(state, side, 'stay')
  if (!needleHandReady(state, side)) return state
  return null
}

function needleHandReady(state: FightState, side: FightSide): boolean {
  return !state[side].hanzoProjection && Boolean(freeDeviceHand(state, side))
}

export function giveNeedleOrder(
  state: FightState,
  side: FightSide,
  order: NeedleOrder,
): FightState {
  const fighter = state[side]
  const targetSide = side === 'player' ? 'opponent' : 'player'
  const target = state[targetSide]
  const puppet = target.needlePuppet
  const next = { ...state, [side]: { ...fighter, illumi: { ...illumiState(fighter), order } } }
  if (!puppet?.needleEmbedded || puppet.owner !== side) return next
  return { ...next, [targetSide]: { ...target, needlePuppet: { ...puppet, order } } }
}

function disguise(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const current = illumiState(fighter)
  if (fighter.y !== 0 || fighter.hanzoProjection || !freeDeviceHand(state, side)) return state
  if (current.disguised) return { ...state, [side]: clearIllumiFace(fighter) }
  if (fighter.aura < ILLUMI_DISGUISE_COST) return state
  return {
    ...state,
    [side]: {
      ...fighter,
      aura: fighter.aura - ILLUMI_DISGUISE_COST,
      illumi: {
        ...current,
        preparation: ILLUMI_DISGUISE_FRAMES,
        mediumCopyId:
          fighter.illumiDisguisePlan === 'unpinned-hisoka'
            ? undefined
            : fighter.equipmentProps?.needles?.copyId,
        disguiseMode: fighter.illumiDisguisePlan ?? 'pinned-gittarackur',
        disguiseOrigin: newGumSource(fighter),
        disguiseExpiresAt: undefined,
        anchor: { x: fighter.x, y: fighter.y },
      },
    },
  }
}

function canIssueCommand(fighter: import('./types').ArcadeFighter): boolean {
  return !fighter.attack && canStartFighterAttack(fighter, 'light')
}
