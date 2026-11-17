import { ContinuousDirector } from './continuousDirector'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

/** A real decision victory preserves the music's nonlethal nature. */
export function createMelodyFatalityFilm(
  options: { target?: FighterId; stageId?: FightStageId; side?: FightSide } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const target = options.target ?? 'chrollo',
    stageId = options.stageId ?? 'banquet-hall'
  const loser = side === 'player' ? 'opponent' : 'player'
  f.cut({
    player: side === 'player' ? 'melody' : target,
    opponent: side === 'player' ? target : 'melody',
    stageId,
    gap: 4,
    title: 'MELODY — UN CHAMP AU PRINTEMPS',
    subtitle: 'Enchanting Music',
    tags: ['ÉMISSION'],
    ren: false,
  })
  f.advance()
  f.hit(side, 'standingHeavy')
  f.until(() => f.free(side) && f.free(loser))
  f.until(() => f.state.remainingFrames <= 240, 10000)
  const before = f.state[loser].health
  f.hit(side, 'neutralSpecial')
  f.advance(60)
  const playing = Boolean(f.state[side].melodyPerformance?.playingFrames)
  const entranced = f.state[loser].hatsuEffects.entrancedFrames > 0
  f.move(loser, 'standingHeavy')
  f.advance(12)
  const harmless = f.state[loser].health === before
  f.until(() => f.state.phase === 'finished', 300)
  const alive = f.state[loser].health > 0
  if (
    !playing ||
    !entranced ||
    !harmless ||
    !alive ||
    f.state.winner !== side ||
    f.state.finishReason !== 'time'
  )
    throw new Error(
      `Native Melody decision required: ${JSON.stringify({ playing, entranced, harmless, alive, winner: f.state.winner, reason: f.state.finishReason, aura: f.state[side].aura, mode: f.state[side].nen.mode })}`,
    )
  return {
    state: f.state,
    report: {
      ...f.report(),
      duration: 10,
      frameCount: 600,
      character: 'Melody',
      target,
      stageId,
      winner: side,
      playing,
      entranced,
      harmless,
      alive,
      nonlethal: true,
      victory: {
        musicFrame: 48,
        entranceFrame: 144,
        meadowFrame: 210,
        flowerFrame: 324,
        portraitFrame: 468,
      },
      source:
        'One native fight earns a health lead and a real time decision while the flute pacifies an actual hearing listener. No music damage, death, permanent sleep, health reset or forced three-minute effect is added. The meadow is the listener’s subjective perception.',
    },
  }
}
