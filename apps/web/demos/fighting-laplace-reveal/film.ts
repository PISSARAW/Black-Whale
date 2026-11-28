import { beginFight, createFight, performAttack, tickFight } from '../../src/lib/fighting/engine'
import { futureVisibleState } from '../../src/lib/fighting/parallelFuturePresentation'
import { EMPTY_INPUT, type FightInput, type FightState } from '../../src/lib/fighting/types'

/** A late-round setup. After setup every movement, shot and verdict uses native commands. */
export function createLaplaceRevealFilm(
  options: { counter?: boolean; projectedShot?: boolean } = {},
) {
  const initial = beginFight(
    createFight('theta', 'tserriednich', { mode: 'versus-ai', formatId: 'arcade' }),
  )
  let state: FightState = {
    ...initial,
    time: 38,
    remainingFrames: 38 * 60,
    opponent: { ...initial.opponent, x: 70, health: 18 },
  }
  const states: FightState[] = []
  const events: {
    frame: number
    event: string
    realX: number
    visibleX: number
    realHealth: number
    visibleHealth: number
  }[] = []
  let activation = -1,
    killed = -1,
    reveal = -1,
    skip = -1
  let divergence = 0
  for (let frame = 0; frame < 900; frame++) {
    if (frame === 60) {
      state = performAttack(state, 'opponent', 'special')
      activation = frame
    }
    if (state.parallelFuture?.phase === 'vision')
      state = performAttack(state, 'opponent', 'special')
    const future = state.parallelFuture
    const cursor = future?.phase === 'diverging' ? future.cursor : -1
    if (cursor >= 0) divergence++
    if (cursor === 140) state = fireTheta(state, options.projectedShot)
    if (options.counter !== false && reveal >= 0 && frame === reveal + 50)
      state = performAttack(state, 'opponent', 'ranged')
    const player = { ...EMPTY_INPUT, right: frame < 20 }
    const opponent: FightInput = {
      ...EMPTY_INPUT,
      left: cursor >= 0 && cursor < 140,
      jump: cursor === 55 && !options.projectedShot,
    }
    const before = state
    state = tickFight(state, player, { dt: 1 / 60, opponentInput: opponent, ai: false })
    const visible = futureVisibleState(state, 'player')
    if (killed < 0 && visible.phase === 'finished' && state.phase === 'fighting') {
      killed = frame
      skip = frame + 105
    }
    if (reveal < 0 && before.futurePerception && !state.futurePerception) reveal = frame
    if ([activation, killed, reveal].includes(frame))
      events.push({
        frame,
        event:
          frame === activation ? 'activation' : frame === killed ? 'illusory-knockout' : 'reveal',
        realX: state.opponent.x,
        visibleX: visible.opponent.x,
        realHealth: state.opponent.health,
        visibleHealth: visible.opponent.health,
      })
    states.push(state)
    if (reveal >= 0 && frame >= reveal + 179) break
  }
  return {
    states,
    visibleStates: states.map((frame) => futureVisibleState(frame, 'player')),
    report: {
      frames: states.length,
      duration: states.length / 60,
      activation,
      killed,
      reveal,
      skip,
      divergence,
      events,
      initialHealth: initial.opponent.health,
      setupHealth: 18,
      realHealth: state.opponent.health,
      realWins: state.roundsWon.player,
      realPhase: state.phase,
      playerHealth: state.player.health,
    },
  }
}

/** The diary's two passes stage the same shot, with the projected hit isolated in Theta's view. */
function fireTheta(state: FightState, projectedShot?: boolean): FightState {
  if (!projectedShot || !state.futurePerception) return performAttack(state, 'player', 'ranged')
  return { ...state, futurePerception: performAttack(state.futurePerception, 'player', 'ranged') }
}
