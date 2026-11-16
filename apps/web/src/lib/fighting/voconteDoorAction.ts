import { canStartFighterAttack, startFighterAttack } from './fighterAttacks'
import { hatsuSourceFor, triggerHatsu } from './hatsu'
import { doorNenAvailable, DOOR_MOVE, DOOR_SETUP_AURA } from './voconteDoors'
import type { AuraAttackOptions } from './auraAttackAction'
import type { ArcadeFighter, FightState } from './types'

export function doorCanPrepare(fighter: ArcadeFighter): boolean {
  return (
    doorNenAvailable(fighter) &&
    fighter.aura >= DOOR_SETUP_AURA &&
    fighter.y === 0 &&
    !fighter.attack &&
    !fighter.chainJail &&
    !fighter.drainingChain &&
    canStartFighterAttack(fighter, 'light')
  )
}

export function performVoconteDoorAction(options: AuraAttackOptions): FightState | null {
  const { state, side, kind, moveId } = options
  const fighter = state[side]
  if (kind !== 'special' || hatsuSourceFor(fighter, moveId) !== 'voconte') return null
  if (state.phase !== 'fighting' || !doorCanPrepare(fighter)) return state
  const witnessed = triggerHatsu(state, side, 'voconte')
  const started = startFighterAttack({
    fighter: witnessed[side],
    kind: 'special',
    moveId: DOOR_MOVE,
    variant: 'standing',
    auraCharged: false,
    concealed: false,
    hatsuSource: 'voconte',
  })
  const doors = state.voconteDoors ?? { networks: {}, transported: [] }
  const active = doors.networks[side]?.active ?? false
  return {
    ...witnessed,
    [side]: { ...started, attack: { ...started.attack!, moveId: moveId ?? DOOR_MOVE } },
    voconteDoors: {
      ...doors,
      networks: { ...doors.networks, [side]: { active, pending: { open: !active } } },
    },
  }
}

export function voconteMoveResources(fighter: ArcadeFighter, moveId: string): boolean | null {
  return hatsuSourceFor(fighter, moveId) === 'voconte' ? doorCanPrepare(fighter) : null
}
