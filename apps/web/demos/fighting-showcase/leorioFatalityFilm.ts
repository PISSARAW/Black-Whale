import { ContinuousDirector } from './continuousDirector'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

/** The real surface punch must award the victory before the ceiling choreography. */
export function createLeorioFatalityFilm(
  options: { target?: FighterId; stageId?: FightStageId; side?: FightSide } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const target = options.target ?? 'hisoka',
    loser = side === 'player' ? 'opponent' : 'player'
  const stageId = options.stageId ?? 'vip-casino'
  f.cut({
    player: side === 'player' ? 'leorio' : target,
    opponent: side === 'player' ? target : 'leorio',
    stageId,
    gap: 4,
    title: 'LEORIO — L’ÉTAGE SUPÉRIEUR',
    subtitle: 'Poing à distance',
    tags: ['REMOTE PUNCH'],
    ren: false,
  })
  f.advance()
  for (let i = 0; f.state[loser].health > 65 && i < 65; i++) {
    f.until(() => f.free(side) && f.free(loser))
    f.close(side, 4)
    f.hit(side, 'standingHeavy')
  }
  for (let i = 0; f.state.phase === 'fighting' && i < 12; i++) {
    f.until(() => f.free(side) && f.free(loser))
    if (f.state[side].aura < 45) {
      f.held[side] = { down: true, aura: true }
      f.until(() => f.state[side].aura >= 99, 600)
      f.held[side] = {}
      f.advance()
    }
    f.close(side, 18)
    f.ranged(side)
    f.advance(85)
  }
  if (
    f.state.winner !== side ||
    f.state[loser].health !== 0 ||
    f.state.impact?.projectileId == null
  )
    throw new Error(
      `Leorio must win with a native remote punch: ${JSON.stringify({ phase: f.state.phase, winner: f.state.winner, health: f.state[loser].health, aura: f.state[side].aura, impact: f.state.impact })}`,
    )
  return {
    state: f.state,
    report: {
      ...f.report(),
      frameCount: 600,
      duration: 10,
      character: 'Leorio',
      target,
      stageId,
      winner: side,
      nativeFinishingProjectile: f.state.impact.projectileId,
      source:
        'Native production remote-punch knockout followed by a cosmetic seven-hit sequence and ceiling launch. No additional combat damage or arena collision is added.',
      victory: {
        hitFrames: [114, 150, 186, 222, 258, 294],
        finalPunchFrame: 348,
        ceilingFrame: 420,
        announcementFrame: 480,
      },
    },
  }
}
