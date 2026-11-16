import type { FightSide, FightState } from '../types'
declare module '../types' {
  interface FightState {
    /** UI snapshot only; the server referee always keeps canonical seats and versus-local mode. */
    pvpSeat?: FightSide
  }
}
export function fightSeatLabel(state: FightState, side: FightSide, language: 'fr' | 'en'): string {
  if (state.pvpSeat) {
    const seat =
      side === 'player' ? state.pvpSeat : state.pvpSeat === 'player' ? 'opponent' : 'player'
    return `${seat === 'player' ? 'P1' : 'P2'}${side === 'player' ? (language === 'fr' ? ' · Toi' : ' · You') : ''}`
  }
  if (side === 'player') return 'P1'
  return state.mode === 'versus-ai' ? 'CPU' : state.mode === 'training' ? 'DUMMY' : 'P2'
}
