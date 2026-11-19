import { beginFight, createFight } from '../../engine'
import { packReplayInput } from '../../fightReplayInput'
import type { SeatScript } from './loopback'
import { EMPTY_INPUT, type FightState, type FighterId } from '../../types'
import type { PvpCommand } from '../types'

/** Long rounds: the check is about agreement, so the duel should stay in play. */
export function longDuel(player: FighterId, opponent: FighterId): FightState {
  const state = beginFight(
    createFight(player, opponent, { mode: 'versus-local', formatId: 'knockout' }),
  )
  const sturdy = { health: 100000, maxHealth: 100000 }
  return {
    ...state,
    player: { ...state.player, ...sturdy },
    opponent: { ...state.opponent, ...sturdy },
  }
}

/** Human-like holds that change every 9 frames, attacks, specials and speech. */
export const script: SeatScript = (side, frame) => {
  const index = side === 'player' ? 0 : 1
  const r = (Math.floor(frame / 9) * 7919 + index * 104729) % 97
  const input = packReplayInput({
    ...EMPTY_INPUT,
    left: r < 25,
    right: r > 70,
    down: r % 5 === 0,
    guard: r % 6 === 0,
    jump: frame % 53 === index * 11,
    aura: r % 9 === 0,
  })
  const commands: PvpCommand[] = []
  if (frame % 40 === index * 13) commands.push({ kind: 'move', action: 'light', input })
  if (frame % 90 === index * 30 + 5) commands.push({ kind: 'move', action: 'special', input })
  if (frame % 150 === 75 + index) commands.push({ kind: 'talk', words: 'Encore.' })
  return { input, commands }
}
