import { visitAttackSource } from './visitSceneKit'
import { PADAILLE_RELEASE, padailleNenActive } from './padailleWeapon'
import type { ArcadeFighter, FightSide, FightState } from './types'

export const BODY_HATSU_FRAMES = 18
export interface BodyHatsuFrame {
  gel: number | null
  tool: number | null
  selected: ArcadeFighter['padailleTool']
}
function observe(fighter: ArcadeFighter) {
  const attack = fighter.attack
  return {
    gel: attack?.kind === 'special' && visitAttackSource(fighter) === 'gel',
    attackFrame: attack?.frame ?? -1,
    tool: padailleNenActive(fighter) ? fighter.padailleTool : undefined,
    restoring: attack?.moveId === PADAILLE_RELEASE && padailleNenActive(fighter),
  }
}
type Observation = ReturnType<typeof observe>
const empty = (): BodyHatsuFrame => ({ gel: null, tool: null, selected: undefined })
function elapsed(start: number | null, frame: number) {
  return start !== null && frame - start < BODY_HATSU_FRAMES ? frame - start : null
}
function update(
  before: Observation,
  next: Observation,
  c: { held: BodyHatsuFrame; frame: number },
) {
  if (next.gel && (!before.gel || next.attackFrame < before.attackFrame)) c.held.gel = c.frame
  if (!next.gel) c.held.gel = null
  if (next.tool !== before.tool) c.held.tool = next.tool || next.restoring ? c.frame : null
  c.held.selected = next.tool
  return {
    gel: elapsed(c.held.gel, c.frame),
    tool: elapsed(c.held.tool, c.frame),
    selected: next.tool,
  }
}
/** Changes in the actual arm/tool, never buffered inputs or speculative hits. */
export function createBodyHatsuClock() {
  let previous: { key: string; frame: number; player: Observation; opponent: Observation } | null =
    null
  let held = { player: empty(), opponent: empty() }
  return (state: FightState): Record<FightSide, BodyHatsuFrame> => {
    const next = {
      key: `${state.player.id}:${state.opponent.id}:${state.roundNumber}:${state.environment.stageId}`,
      frame: state.frame,
      player: observe(state.player),
      opponent: observe(state.opponent),
    }
    if (
      !previous ||
      previous.key !== next.key ||
      next.frame < previous.frame ||
      state.phase !== 'fighting'
    ) {
      previous = next
      held = { player: empty(), opponent: empty() }
      return { player: empty(), opponent: empty() }
    }
    const result = {
      player: update(previous.player, next.player, { held: held.player, frame: state.frame }),
      opponent: update(previous.opponent, next.opponent, {
        held: held.opponent,
        frame: state.frame,
      }),
    }
    previous = next
    return result
  }
}
