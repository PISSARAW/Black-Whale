import { ContinuousDirector } from './continuousDirector'
import { isThetaBullet } from '../../src/lib/fighting/thetaFirearm'
import { THETA_TIMING } from '../../src/lib/fighting/victory/thetaPose'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

/** Earn the verdict with the native physical pistol, without adding a personal Hatsu. */
export function createThetaFilm(
  options: {
    target?: FighterId
    side?: FightSide
    stageId?: FightStageId
  } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const target = options.target ?? 'rihan',
    stageId = options.stageId ?? 'vip-casino'
  const loser = side === 'player' ? 'opponent' : 'player'
  f.cut({
    player: side === 'player' ? 'theta' : target,
    opponent: side === 'player' ? target : 'theta',
    stageId,
    gap: 12,
    title: 'THETA',
    subtitle: 'Une balle d’avance',
    tags: [],
    ren: false,
  })
  f.advance()
  let physicalBullet = false
  for (let i = 0; f.state.phase === 'fighting' && i < 60; i++) {
    f.until(() => f.free(side) && f.free(loser), 300)
    f.close(side, 12)
    f.move(side, 'neutralSpecial')
    f.until(() => f.state.projectiles.some(isThetaBullet) || !f.state[side].attack)
    physicalBullet ||= f.state.projectiles.some(isThetaBullet)
    f.until(
      () => f.state.phase === 'finished' || (!f.state.projectiles.length && f.free(side)),
      300,
    )
  }
  if (!physicalBullet || f.state.winner !== side || f.state[loser].health !== 0)
    throw new Error('Theta demo requires a native physical-pistol knockout')
  return {
    state: f.state,
    report: {
      ...f.report(),
      duration: 10,
      frameCount: 600,
      hero: 'theta',
      target,
      stageId,
      winner: side,
      physicalBullet,
      inventedHatsu: false,
      timings: THETA_TIMING,
      source:
        'A native physical-pistol knockout precedes a post-verdict mechanical feint: removing a magazine leaves one chambered round. The scene uses one shot, one casing and ordinary physical movement; it grants Theta no undisclosed Hatsu and changes no match result.',
    },
  }
}
