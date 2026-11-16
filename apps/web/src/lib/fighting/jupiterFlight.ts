import { battleMindAvailable, battleTechniqueAvailable } from './battleCantabileRules'
import { BATTLE_MOVES, BATTLE_SOUND_RANGE } from './battleCantabileTypes'
import { sleepingBody } from './hanzoProjection'
import type { ArcadeFighter, FightProjectile, FightState } from './types'

/** Earshot is a spatial bound, not a demand that the victim voluntarily listen. */
export function advanceJupiter(
  state: FightState,
  shot: FightProjectile,
  step: number,
): FightProjectile | null {
  const performer = state[shot.owner]
  const target = sleepingBody(state[shot.owner === 'player' ? 'opponent' : 'player'])
  if (!jupiterMusicLive(performer) || target.health <= 0) return null
  if (Math.hypot(performer.x - target.x, performer.y - target.y) > BATTLE_SOUND_RANGE) return null
  const dx = target.x - shot.x
  const dy = target.y + 6 - shot.y
  const distance = Math.hypot(dx, dy)
  const travel = Math.min(distance, 84 * step)
  const direction = distance > 0 ? travel / distance : 0
  return {
    ...shot,
    x: shot.x + dx * direction,
    y: shot.y + dy * direction,
    velocityX: distance > 0 ? (dx / distance) * 84 : 0,
    age: shot.age + 1,
  }
}

function jupiterMusicLive(performer: ArcadeFighter): boolean {
  return (
    battleTechniqueAvailable(performer, BATTLE_MOVES.jupiter) &&
    battleMindAvailable(performer) &&
    !performer.blocking &&
    !performer.battleCantabile?.form
  )
}
