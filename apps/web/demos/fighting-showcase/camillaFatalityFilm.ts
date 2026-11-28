import { ContinuousDirector } from './continuousDirector'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import * as timing from '../../src/lib/fighting/victory/camillaTiming'
import type { FightStageId } from '../../src/lib/fighting/stages'

/** Resolve the real attributed death, consumption and revival before showing the victory edit. */
export function createCamillaFatalityFilm(
  options: { target?: FighterId; stageId?: FightStageId; side?: FightSide } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const target = options.target ?? 'musse',
    loser = side === 'player' ? 'opponent' : 'player'
  const stageId = options.stageId ?? 'camilla-salon'
  f.cut({
    player: side === 'player' ? 'camilla' : target,
    opponent: side === 'player' ? target : 'camilla',
    stageId,
    gap: 4,
    title: 'CAMILLA — LE CHAT QUI REVIENT',
    subtitle: 'Cat’s Name',
    tags: ['NEN POST MORTEM'],
    ren: false,
  })
  f.held[side] = { zetsuIntent: true }
  f.advance()
  for (let i = 0; f.state.phase === 'fighting' && i < 65; i++) {
    f.until(() => f.free(side) && f.free(loser))
    if (f.state.phase !== 'fighting') break
    f.close(loser, 4)
    if (target === 'musse') {
      f.ranged(loser)
      f.until(() => Boolean(f.state.catsName) || !f.state[loser].attack, 90)
    } else f.hit(loser, 'standingHeavy')
    if (f.state.catsName) f.until(() => !f.state.catsName, 150)
  }
  const nativeSequence = f.states.filter((state) => state.catsName)
  if (
    f.state.winner !== side ||
    f.state[loser].health !== 0 ||
    f.state[side].health !== f.state[side].maxHealth ||
    !f.state.catsNameFatality?.zetsu ||
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
        'The production engine attributes the lethal hit and resolves Cat’s Name before playback.',
      victory: {
        contactFrame: timing.CAMILLA_CONTACT,
        bodyLandsFrame: timing.CAMILLA_BODY_LANDS,
        pawLandsFrame: timing.CAMILLA_PAW_LANDS,
        revealFrame: timing.CAMILLA_REVEAL,
        gripFrame: timing.CAMILLA_GRIP,
        liftFrame: timing.CAMILLA_LIFT,
        clenchFrame: timing.CAMILLA_CLENCH,
        absorptionFrame: timing.CAMILLA_ABSORB,
        tailChargedFrame: timing.CAMILLA_TAIL_CHARGED,
        dropFrame: timing.CAMILLA_DROP,
        returnFrame: timing.CAMILLA_RETURN,
        handFrame: timing.CAMILLA_HAND,
        inhaleFrame: timing.CAMILLA_INHALE,
        eyeOpeningFrame: timing.CAMILLA_EYES_OPEN,
        riseFrame: timing.CAMILLA_RISE,
        verdictFrame: timing.CAMILLA_VERDICT,
      },
    },
  }
}
