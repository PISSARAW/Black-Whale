import { createThrowCinematic } from './throwCinematic'
import { throwBodyPosition, thrownVisualFighter } from './throwCinematicMotion'
import type { VictoryFrame } from './victory/playback'
import type { ArcadeFighter, FightSide, FightState } from './types'

interface BasePresentation {
  position: (state: FightState, side: FightSide) => { x: number; y: number }
  fighter: (state: FightState, side: FightSide) => ArcadeFighter
  poseFraction: (state: FightState) => number
  bodyPosition: (state: FightState, side: FightSide) => { x: number; y: number; z?: number }
}

export function withThrowPresentation(base: BasePresentation) {
  const film = createThrowCinematic()
  return {
    ...base,
    observe(
      state: FightState,
      seconds: number,
      options: { reduced: boolean; victory: VictoryFrame | null },
    ) {
      film.observe(state, seconds, {
        enabled: !options.reduced,
        finalRemaining: options.victory?.pendingThrow,
      })
    },
    throwFrame: film.current,
    fighter(state: FightState, side: FightSide) {
      const fighter = base.fighter(state, side)
      if (film.current()?.victim !== side) return fighter
      const position = throwBodyPosition({ state, side, frame: film.current(), fallback: fighter })
      return thrownVisualFighter(fighter, position)
    },
    bodyPosition(state: FightState, side: FightSide) {
      return throwBodyPosition({
        state,
        side,
        frame: film.current(),
        fallback: base.bodyPosition(state, side),
      })
    },
  }
}
