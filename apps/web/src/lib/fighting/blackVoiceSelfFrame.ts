import { walkSpeed } from './fighterMovement'
import { FIGHT_FPS } from './fightClock'
import { physicalBodyAt } from './fightBodyIdentity'
import { startFighterAttack } from './fighterAttacks'
import { collideArenaBodies } from './arenaSimulation'
import { visibleSelfEnemy, AUTOPILOT_FRAME_COST, settleVoiceAutopilot } from './blackVoiceAutopilot'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** No voluntary commands: the actual body pursues its declared, physically present opponent. */
export function advanceVoiceSelf(state: FightState, side: FightSide): FightState {
  const actor = state[side],
    mode = actor.blackVoiceAutopilot
  if (!mode) return state
  const enemy = physicalBodyAt(state, mode.target, mode.targetMember)
  if (!enemy || enemy.health <= 0) return settleVoiceAutopilot(state)
  const aura = Math.max(0, actor.aura - AUTOPILOT_FRAME_COST)
  if (aura === 0)
    return settleVoiceAutopilot({ ...state, [side]: { ...actor, aura: 0, auraExhausted: true } })
  const point = visibleSelfEnemy(actor, enemy) ? { x: enemy.x, y: enemy.y } : mode.lastSeen
  const body = {
    ...actor,
    aura,
    blackVoiceAutopilot: { ...mode, lastSeen: point },
    hatsuEffects: { ...actor.hatsuEffects, manipulatedFrames: 1 },
    blocking: false,
    bufferedAttack: null,
  }
  return collideArenaBodies(state, { ...state, [side]: selfBody(body, point) })
}
function selfBody(actor: ArcadeFighter, point: { x: number; y: number }): ArcadeFighter {
  if (actor.hitStun > 0 || actor.knockdownFrames > 0 || actor.attack) return actor
  const direction = Math.sign(point.x - actor.x)
  const facing = direction === 0 ? actor.facing : direction < 0 ? (-1 as const) : (1 as const)
  if (Math.hypot(point.x - actor.x, point.y - actor.y) > 6)
    return {
      ...actor,
      facing,
      pose: 'walk',
      x: Math.max(7, Math.min(93, actor.x + (direction * walkSpeed(actor)) / FIGHT_FPS)),
    }
  // Own ordinary kick, not an enemy's Hatsu. The aura budget pays for the Nen output separately.
  return startFighterAttack({
    fighter: { ...actor, facing },
    kind: 'heavy',
    moveId: 'chrollo:forwardHeavy',
    auraCharged: false,
    concealed: false,
    hatsuSource: null,
    auraCost: 0,
  })
}
