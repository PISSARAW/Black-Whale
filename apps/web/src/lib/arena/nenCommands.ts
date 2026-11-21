import type { NenTechniqueAction } from '@black-whale/nen-engine'
import type { BodyZone, CombatAction, FighterState } from '../combat/types'
import { arenaRyuAction } from './controls'

/** The HUD feedback a player command plays when the engine accepts it. */
export type CommandAnimation =
  | 'strike'
  | 'ko'
  | 'ryu-up'
  | 'ryu-down'
  | `zone-${BodyZone}`
  | 'ten'
  | 'ren'
  | 'zetsu'
  | 'gyo'
  | 'in'
  | 'ken'
  | 'hatsu'

export interface ArenaCommand {
  action: CombatAction
  animation: CommandAnimation
}

/**
 * Translates the shared Tour Nen vocabulary into one Arena command. `ON` is
 * not a combat action: it stays with the mode's extended Nen state.
 */
export function standardNenCommand(
  action: NenTechniqueAction,
  player: Pick<FighterState, 'attackShare' | 'guard'>,
): ArenaCommand | 'extended' | null {
  if (action.type === 'ON') return 'extended'
  if (action.type === 'RYU') return ryuCommand(action, player)
  return auraCommand(action) ?? techniqueCommand(action)
}

function auraCommand(action: NenTechniqueAction): ArenaCommand | null {
  if (action.type === 'TEN' || action.type === 'REN' || action.type === 'ZETSU') {
    const mode = action.type.toLowerCase() as 'ten' | 'ren' | 'zetsu'
    return { action: { type: 'MODE', side: 'player', mode }, animation: mode }
  }
  if (action.type === 'GYO' || action.type === 'IN' || action.type === 'KEN')
    return {
      action: { type: action.type, side: 'player', on: action.on },
      animation: action.type.toLowerCase() as 'gyo' | 'in' | 'ken',
    }
  return null
}

function techniqueCommand(action: NenTechniqueAction): ArenaCommand | null {
  if (action.type === 'EN')
    return { action: { type: 'EN', side: 'player', radius: action.radius }, animation: 'gyo' }
  if (action.type === 'SHU')
    return {
      action: { type: 'SHU', side: 'player', objectId: action.objectId, on: action.on },
      animation: 'hatsu',
    }
  if (action.type === 'KO' && action.zone)
    return { action: { type: 'KO', side: 'player', zone: koZone(action.zone) }, animation: 'ko' }
  return null
}

function ryuCommand(
  action: Extract<NenTechniqueAction, { type: 'RYU' }>,
  player: Pick<FighterState, 'attackShare' | 'guard'>,
): ArenaCommand {
  const ryu = arenaRyuAction(action, player)
  const rising = (ryu.attackShare ?? player.attackShare) >= player.attackShare
  return { action: ryu, animation: rising ? 'ryu-up' : 'ryu-down' }
}

function koZone(zone: string): BodyZone {
  if (zone === 'feet') return 'legs'
  if (zone === 'hands') return 'arms'
  return zone as BodyZone
}
