import { ContinuousDirector } from './continuousDirector'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

/** Resolve the real attributed death, consumption and revival before showing the victory edit. */
export function createCamillaFatalityFilm(
  options: { target?: FighterId; stageId?: FightStageId; side?: FightSide } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const target = options.target ?? 'chrollo',
    loser = side === 'player' ? 'opponent' : 'player'
  const stageId = options.stageId ?? 'camilla-salon'
  f.cut({
    player: side === 'player' ? 'camilla' : target,
    opponent: side === 'player' ? target : 'camilla',
    stageId,
    gap: 4,
    title: 'CAMILLA — LE SOUFFLE',
    subtitle: 'Cat’s Name',
    tags: ['NEN POST MORTEM'],
    ren: false,
  })
  f.advance()
  for (let i = 0; f.state.phase === 'fighting' && i < 65; i++) {
    f.until(() => f.free(side) && f.free(loser))
    if (f.state.phase !== 'fighting') break
    f.close(loser, 4)
    f.hit(loser, 'standingHeavy')
    if (f.state.catsName) f.until(() => !f.state.catsName, 150)
  }
  const nativeSequence = f.states.filter((state) => state.catsName)
  if (
    f.state.winner !== side ||
    f.state[loser].health !== 0 ||
    f.state[side].health !== f.state[side].maxHealth ||
    nativeSequence.length === 0
  )
    throw new Error(
      `Camilla requires a native post-mortem victory: ${JSON.stringify({ winner: f.state.winner, health: f.state[side].health, opponent: f.state[loser].health, nativeSequence: nativeSequence.length })}`,
    )
  return {
    state: f.state,
    report: {
      ...f.report(),
      frameCount: 600,
      duration: 10,
      character: 'Camilla',
      target,
      stageId,
      winner: side,
      postMortemFrames: nativeSequence.length,
      consumed: f.state.catsNameConsumed,
      source:
        'The production engine resolves Cat’s Name and awards Camilla the win. The following adaptive victory reconstruction preserves the existing two-paw crush, absorption and still eye-opening portrait without writing health or outcomes.',
      victory: {
        summonEndFrame: 102,
        gripFrame: 153,
        compressionFrame: 195,
        absorptionFrame: 306,
        consumedFrame: 357,
        portraitFrame: 510,
        eyeOpeningFrame: 554,
        inhaleFrame: 558,
      },
    },
  }
}
