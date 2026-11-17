import { hasDuelComboProfile } from './duelComboProfiles'
import { attackAuraCost } from './fightAttackCost'
import { attackData } from './frameData'
import { canStartFighterAttack } from './fighterAttacks'
import { canUseMovesetMove, moveById } from './movesets'
import type { FighterMove } from './movesetTypes'
import type { ArcadeFighter, FightState, FightSide } from './types'

type ComboChoiceStatus = 'unavailable' | 'blocked' | 'late' | 'confirm' | 'ready' | 'wait'

/** Read-only player guidance: admission and the next impact still belong to the engine. */
export function comboChoices(state: FightState, side: FightSide = 'player') {
  const fighter = state[side]
  const current = moveById(fighter.attack?.moveId)
  if (!hasDuelComboProfile(fighter.id) || !fighter.attack || !current) return []
  return [
    ...current.cancelInto.map((id) => ({ id, link: false })),
    ...(current.linkInto ?? []).map((id) => ({ id, link: true })),
  ].flatMap(({ id, link }) => {
    const move = moveById(id)
    if (!move) return []
    const cost = attackAuraCost({
      fighter,
      kind: move.kind,
      moveId: move.id,
      concealed: fighter.nen.in && move.kind === 'special',
    })
    const status = choiceStatus({ state, side, current, move, link })
    return [{ move, link, cost, status }]
  })
}

function choiceStatus(options: {
  state: FightState
  side: FightSide
  current: FighterMove
  move: FighterMove
  link: boolean
}): ComboChoiceStatus {
  const { state, side, current, move, link } = options
  const fighter = state[side]
  const attack = fighter.attack!
  // A recovery link may require a free body (Cyclotron); preview that state only for guidance.
  const readiness = link ? { ...state, [side]: { ...fighter, attack: null } } : state
  if (!canUseMovesetMove(readiness, side, move)) return 'unavailable'
  if (attack.confirmedBlock && !current.cancelOnBlockInto.includes(move.id)) return 'blocked'
  const target = state[side === 'player' ? 'opponent' : 'player']
  if (choiceExpired({ fighter, target, move, link })) return 'late'
  if (!attack.confirmedHit && !attack.confirmedBlock) return 'confirm'
  return canStartFighterAttack(fighter, move.kind, move.id) ? 'ready' : 'wait'
}

function choiceExpired(options: {
  fighter: ArcadeFighter
  target: ArcadeFighter
  move: FighterMove
  link: boolean
}) {
  const { fighter, target, move, link } = options
  const attack = fighter.attack!
  if (attack.confirmedHit && target.hitStun <= move.tuning.startup) return true
  return !link && attack.frame > attackData(attack.kind, fighter).cancelEnd
}
