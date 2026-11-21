import { hatsuSourceFor, triggerHatsu } from './hatsu'
import { CHROLLO_SECONDARY } from './chrolloBook'
import { startFighterAttack } from './fighterAttacks'
import {
  CYCLOTRON_PUNCH,
  CYCLOTRON_ROTATION_AURA,
  cyclotronCanAct,
  cyclotronNenActive,
  cyclotronPunchReady,
  holdCyclotron,
  pauseCyclotron,
} from './phinksCyclotron'
import type { AuraAttackOptions } from './auraAttackAction'
import { cyclotronComboRelease } from './phinksComboRelease'
import type { ArcadeFighter, FightState } from './types'

export function cyclotronIntent(fighter: ArcadeFighter, moveId?: string): 'wind' | 'punch' | null {
  if (hatsuSourceFor(fighter, moveId) !== 'phinks') return null
  if (fighter.id === 'chrollo')
    return moveId === CHROLLO_SECONDARY || fighter.hatsuEffects.cyclotronTurns > 0
      ? 'punch'
      : 'wind'
  return moveId === CYCLOTRON_PUNCH ? 'punch' : 'wind'
}

export function performCyclotronAction(options: AuraAttackOptions): FightState | null {
  const { state, side, kind, moveId } = options
  const fighter = state[side]
  // Ordinary blows go on while the arm turns (rotation en mouvement, phinksCyclotron.ts).
  if (kind !== 'special') return null
  const intent = cyclotronIntent(fighter, moveId)
  if (!intent) return null
  if (state.phase !== 'fighting') return state
  if (intent === 'punch' && cyclotronComboRelease(fighter)) return releaseCyclotron(options, true)
  if (!cyclotronCanAct(fighter)) return state
  if (intent === 'punch') return releaseCyclotron(options)
  if (fighter.cyclotronWindup) return { ...state, [side]: pauseCyclotron(fighter) }
  if (fighter.aura < CYCLOTRON_ROTATION_AURA) return state
  const witnessed = triggerHatsu(state, side, 'phinks')
  return {
    ...witnessed,
    [side]: { ...holdCyclotron(witnessed[side]), cyclotronWindup: { frame: 0 } },
  }
}

function releaseCyclotron({ state, side, moveId }: AuraAttackOptions, combo = false): FightState {
  const fighter = state[side]
  if (!combo && !cyclotronPunchReady(fighter)) return state
  const turns = fighter.hatsuEffects.cyclotronTurns
  const prepared = {
    ...pauseCyclotron(fighter),
    hatsuEffects: { ...fighter.hatsuEffects, cyclotronTurns: 0 },
  }
  // The punch is spent on execution, including a miss, block or interrupted startup.
  const started = startFighterAttack({
    fighter: prepared,
    kind: 'special',
    variant: 'standing',
    moveId: CYCLOTRON_PUNCH,
    auraCharged: false,
    concealed: false,
    hatsuSource: 'phinks',
  })
  const executedMove = fighter.id === 'chrollo' ? moveId : CYCLOTRON_PUNCH
  return {
    ...state,
    [side]: {
      ...started,
      attack: {
        ...started.attack!,
        moveId: executedMove,
        cyclotronTurns: turns,
        // A combo release reaches the body the cancelled blow put down.
        ...(combo ? { accel: true as const } : {}),
      },
    },
  }
}

/** Readiness must bypass the generic 40-aura cast: full turns already paid their own cost. */
export function cyclotronMoveResources(fighter: ArcadeFighter, moveId: string): boolean | null {
  const intent = cyclotronIntent(fighter, moveId)
  if (!intent) return null
  if (intent === 'punch') return cyclotronPunchReady(fighter) || cyclotronComboRelease(fighter)
  return (
    cyclotronNenActive(fighter) &&
    (Boolean(fighter.cyclotronWindup) || fighter.aura >= CYCLOTRON_ROTATION_AURA)
  )
}

export function cyclotronAiAction(state: FightState): FightState | null {
  const fighter = state.opponent
  if (fighter.id !== 'phinks') return null
  if (!cyclotronCanAct(fighter)) return null
  const gap = Math.abs(fighter.x - state.player.x)
  if (cyclotronPunchReady(fighter) && gap <= 12)
    return performCyclotronAction({
      state,
      side: 'opponent',
      kind: 'special',
      moveId: CYCLOTRON_PUNCH,
      auraCharged: false,
    })
  if (fighter.cyclotronWindup) {
    if (fighter.hatsuEffects.cyclotronTurns < 3) return state
    return { ...state, opponent: pauseCyclotron(fighter) }
  }
  if (gap < 20 || fighter.hatsuEffects.cyclotronTurns > 0) return null
  return performCyclotronAction({ state, side: 'opponent', kind: 'special', auraCharged: false })
}
