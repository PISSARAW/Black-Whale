import {
  FUTURE_EYES_OPEN,
  FUTURE_FALL,
  FUTURE_FORECAST_SECONDS,
  FUTURE_SHOT,
  FUTURE_VERDICT,
  FUTURE_VISION_START,
  FUTURE_ZETSU_END,
  TSERRIEDNICH_VICTORY_DURATION,
} from '../../src/lib/fighting/victory/tserriednichTiming'
import { ContinuousDirector } from './continuousDirector'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

/** A real 600-frame forecast and physical divergence precede a real projectile K.-O. */
export function createTserriednichFatalityFilm(
  options: { target?: FighterId; stageId?: FightStageId; side?: FightSide } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const target = options.target ?? 'hisoka',
    loser = side === 'player' ? 'opponent' : 'player'
  const stageId = options.stageId ?? 'vip-casino'
  f.cut({
    player: side === 'player' ? 'tserriednich' : target,
    opponent: side === 'player' ? target : 'tserriednich',
    stageId,
    gap: 4,
    title: 'TSERRIEDNICH — DEUX VÉRITÉS',
    subtitle: 'Le même geste, deux issues.',
    tags: ['LAPLACE DEVIL', 'VISION +10 S'],
    ren: false,
  })
  f.advance()
  for (let attempts = 0; f.state[loser].health > 65 && attempts < 65; attempts++) {
    f.until(() => f.free(side) && f.free(loser))
    f.close(side, 4)
    f.hit(side, 'standingHeavy')
  }
  f.until(() => f.free(side) && f.free(loser))
  f.held[side] = f.direction(side, true)
  f.until(() => Math.abs(f.state.player.x - f.state.opponent.x) >= 78, 900)
  f.held[side] = {}
  f.advance()
  f.ranged(loser)
  f.advance()
  f.move(side, 'neutralSpecial')
  f.until(() => f.state.parallelFuture?.phase === 'vision', 90)
  const enteringVision = f.state.parallelFuture?.phase
  if (enteringVision !== 'vision')
    throw new Error(
      `Native ten-second forecast must be ready: ${JSON.stringify({ phase: f.state.phase, future: f.state.parallelFuture?.phase, x: f.state[side].x, otherX: f.state[loser].x, aura: f.state[side].aura, health: f.state[side].health, nen: f.state[side].nen.mode, audit: f.audit.slice(-5) })}`,
    )
  const frozen = {
    frame: f.state.frame,
    time: f.state.time,
    health: f.state[side].health,
    rng: f.state.rng,
  }
  f.until(() => (f.state.parallelFuture?.frames.length ?? 0) === FUTURE_FORECAST_SECONDS * 60, 150)
  const vision = f.state.parallelFuture
  if (vision?.frames.length !== FUTURE_FORECAST_SECONDS * 60)
    throw new Error('Native ten-second forecast must be fully watched before opening the eyes')
  const frozenWhileViewing =
    frozen.frame === f.state.frame &&
    frozen.time === f.state.time &&
    frozen.health === f.state[side].health &&
    frozen.rng === f.state.rng
  if (!frozenWhileViewing)
    throw new Error('Reading the native forecast must not advance the real branch')
  f.move(side, 'finisher')
  const diverged = f.state.parallelFuture?.phase === 'diverging'
  const x = f.state[side].x
  f.held[side] = { ...f.direction(side, true), jump: true }
  f.advance(24)
  f.held[side] = {}
  const displacement = Math.abs(f.state[side].x - x) + f.state[side].y
  f.move(side, 'finisher')
  f.advance()
  if (f.state.parallelFuture)
    throw new Error('The real duel must return to a single timeline before the finishing shot')
  f.held[loser] = f.direction(loser)
  f.until(() => Math.abs(f.state[loser].x - 50) < 3, 180)
  f.held[loser] = {}
  for (let attempts = 0; f.state.phase === 'fighting' && attempts < 45; attempts++) {
    f.until(() => f.free(side))
    f.ranged(side)
    f.advance(48)
  }
  const impacts = f.audit.filter((event) => event.kind === 'impact'),
    last = impacts.at(-1)
  if (
    !diverged ||
    displacement <= 0 ||
    f.state.winner !== side ||
    f.state[loser].health !== 0 ||
    last?.attacker !== side ||
    last.projectileId == null ||
    f.state.finishingShot !== last.projectileId
  )
    throw new Error(`The real branch must win by physical shot: ${JSON.stringify(f.report())}`)
  return {
    state: f.state,
    report: {
      ...f.report(),
      nativeFrameCount: f.states.length,
      frameCount: TSERRIEDNICH_VICTORY_DURATION * 60,
      duration: TSERRIEDNICH_VICTORY_DURATION,
      character: 'Tserriednich',
      target,
      stageId,
      winner: side,
      forecastFrames: vision.frames.length,
      frozenWhileViewing,
      diverged,
      physicalDisplacement: displacement,
      nativeFinishingProjectile: last.projectileId,
      source:
        'One production duel: native voluntary Zetsu, 600-frame forecast, frozen viewing, physical divergence and real firearm projectile knockout. The following cinematic reconstructs the two perceptions without altering combat state.',
      victory: {
        eyesClosedFrame: 0,
        visionFrame: FUTURE_VISION_START * 60,
        openEyesFrame: FUTURE_EYES_OPEN * 60,
        reunionFrame: FUTURE_ZETSU_END * 60,
        shotFrame: FUTURE_SHOT * 60,
        fallFrame: Math.round(FUTURE_FALL * 60),
        verdictFrame: FUTURE_VERDICT * 60,
      },
    },
  }
}
