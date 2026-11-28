import { canAct } from './fightActorState'
import { illumiNenActive, ownsIllumiNeedles } from './illumiAccess'
import { equippedDolphin } from './dolphinBorrowing'
import { performIllumiSupplement } from './illumiConditioning'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState, ArcadeFighter } from './types'

const CONDITIONING_MODES = new Set<string | undefined>(['condition', 'people'])

export function performNeedleModeCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (CONDITIONING_MODES.has(command.target))
    return performIllumiSupplement({ state, side, command })
  const actor = state[side]
  if (!canAct(actor) || actor.attack || actor.hanzoProjection) return state
  if (!needleModeAvailable(actor)) return state
  if (command.target !== 'needle-people' && command.target !== 'face-warp') return state
  return (actor.illumiNeedleMode ?? 'needle-people') === command.target
    ? state
    : { ...state, [side]: { ...actor, illumiNeedleMode: command.target } }
}

function needleModeAvailable(actor: ArcadeFighter): boolean {
  if (!illumiNenActive(actor)) return false
  if (!actor.dolphinExecution) return ownsIllumiNeedles(actor)
  const held = equippedDolphin(actor)
  return Boolean(held?.loaded && !held.returned && held.source === 'illumi')
}

export function needleModeOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!needleModeAvailable(state[side])) return []
  return (['needle-people', 'face-warp'] as const).map((target) => {
    const command: ArsenalCommand = { action: 'illumi-needle-mode', target }
    return {
      command,
      ready: performNeedleModeCommand(state, side, command) !== state,
      labelFr:
        target === 'face-warp'
          ? 'Illumi · Préparer les trois aiguilles du visage'
          : 'Illumi · Préparer Needle People',
      labelEn:
        target === 'face-warp'
          ? 'Illumi · Prepare the three face needles'
          : 'Illumi · Prepare Needle People',
      conditionFr:
        'Choisit la prochaine implantation réelle : front et déformation douloureuse, ou aiguille crânienne et ordre de Needle People. Aiguilles matérielles et contact requis.',
      conditionEn:
        'Selects the next actual implantation: forehead and painful deformation, or Needle People skull needle and order. Physical needles and contact required.',
    }
  })
}
