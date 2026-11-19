import { canAct } from './fightActorState'
import { performIllumiMask } from './illumiMask'
import { illumiAvailable } from './illumiAccess'
import { performCorpseCommand } from './illumiCorpses'
import { priorityLineOfSight } from './priorityOptics'
import type { FightSide, FightState } from './types'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { IllumiNeedleMode } from './illumiNeedleFaceTypes'

declare module './types' {
  interface ArcadeFighter {
    illumiNeedleMode?: IllumiNeedleMode
    conditionedNeedle?: { owner: FightSide; implantedAt: number }
    needleRemoval?: { frames: number; x: number; health: number }
  }
}
export function performIllumiSupplement(options: ArsenalInvocation): FightState {
  const { state, side, command } = options,
    actor = state[side]
  if (command.action === 'illumi-mask') return performIllumiMask(options)
  if (!['illumi-needle-mode', 'illumi-needle-remove'].includes(command.action))
    return performCorpseCommand(options)
  if (!conditioningReady(state, side)) return state
  if (command.action === 'illumi-needle-remove') return removeNeedle(state, side)
  if (
    actor.id !== 'illumi' ||
    !illumiAvailable(actor) ||
    !['people', 'condition'].includes(command.target ?? '')
  )
    return state
  return {
    ...state,
    [side]: { ...actor, illumiNeedleMode: command.target as 'people' | 'condition' },
  }
}
function conditioningReady(state: FightState, side: FightSide): boolean {
  return canAct(state[side]) && !state[side].attack && state.phase === 'fighting' && !state.catsName
}
function removeNeedle(state: FightState, side: FightSide): FightState {
  const actor = state[side]
  if (!actor.conditionedNeedle || actor.needleRemoval) return state
  return {
    ...state,
    [side]: {
      ...actor,
      arenaRecovery: 30,
      needleRemoval: { frames: 30, x: actor.x, health: actor.health },
    },
  }
}
export function advanceConditionedNeedles(state: FightState): FightState {
  for (const side of ['player', 'opponent'] as const) {
    const actor = state[side]
    if (actor.needleRemoval) state = advanceRemoval(state, side)
    else if (actor.conditionedNeedle && canAct(actor) && visibleThreat(state, side)) {
      const enemy = state[side === 'player' ? 'opponent' : 'player']
      state = {
        ...state,
        [side]: {
          ...actor,
          x: Math.max(
            7,
            Math.min(93, actor.x + Math.sign(actor.x - enemy.x || -actor.facing) * 0.25),
          ),
          attack: null,
          bufferedAttack: null,
          blocking: false,
          pose: 'walk',
        },
      }
    }
  }
  return state
}
function advanceRemoval(state: FightState, side: FightSide): FightState {
  const actor = state[side],
    pending = actor.needleRemoval!
  const broken =
    actor.hitStun > 0 || actor.health < pending.health || Math.abs(actor.x - pending.x) > 0.5
  const frames = pending.frames - 1
  return {
    ...state,
    [side]: {
      ...actor,
      needleRemoval: broken || frames <= 0 ? undefined : { ...pending, frames },
      conditionedNeedle: !broken && frames <= 0 ? undefined : actor.conditionedNeedle,
    },
  }
}
function visibleThreat(state: FightState, side: FightSide): boolean {
  const actor = state[side],
    enemy = state[side === 'player' ? 'opponent' : 'player']
  if (!enemy.attack || enemy.attack.concealed || !['heavy', 'special'].includes(enemy.attack.kind))
    return false
  return priorityLineOfSight(state, {
    x: actor.x,
    y: actor.y + 10,
    targetX: enemy.x,
    targetY: enemy.y + 10,
  })
}
export function conditioningOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const actor = state[side]
  const commands: { command: ArsenalInvocation['command']; fr: string; en: string }[] = []
  if (actor.id === 'illumi')
    for (const target of ['people', 'condition'])
      commands.push({
        command: { action: 'illumi-needle-mode', target },
        fr: target === 'people' ? 'Aiguille · Needle People' : 'Aiguille · Conditionner la fuite',
        en: target === 'people' ? 'Needle · Needle People' : 'Needle · Condition retreat',
      })
  if (actor.conditionedNeedle)
    commands.push({
      command: { action: 'illumi-needle-remove' },
      fr: 'Retirer l’aiguille de conditionnement',
      en: 'Remove the conditioning needle',
    })
  return commands.map(({ command, fr, en }) => ({
    command,
    labelFr: fr,
    labelEn: en,
    ready: performIllumiSupplement({ state, side, command }) !== state,
    conditionFr:
      'L’implantation exige toujours le contact réel au crâne. Le conditionnement impose un recul face à une menace visible ; sa suppression physique est lente et interruptible. Il ne se confond pas avec les lésions irréversibles de Needle People.',
    conditionEn:
      'Implantation still requires real skull contact. Conditioning enforces retreat from visible threats; physical removal is slow and interruptible. It is distinct from irreversible Needle People injury.',
  }))
}
