import { ContinuousDirector } from './continuousDirector'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

/** A native Sun/Moon knockout precedes the cosmetic fish combination. */
export function createChrolloFishFatalityFilm(
  options: { target?: FighterId; stageId?: FightStageId; side?: FightSide } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const target = options.target ?? 'hisoka',
    loser = side === 'player' ? 'opponent' : 'player'
  const stageId = options.stageId ?? 'vip-casino'
  f.cut({
    player: side === 'player' ? 'chrollo' : target,
    opponent: side === 'player' ? target : 'chrollo',
    stageId,
    gap: 4,
    title: 'CHROLLO — LE FESTIN DU SOLEIL ET DE LA LUNE',
    subtitle: 'Indoor Fish · Sun and Moon',
    tags: ['INDOOR FISH', 'SUN AND MOON'],
    ren: false,
  })
  f.advance()
  for (let attempts = 0; f.state[loser].health > 26 && attempts < 65; attempts++) {
    f.until(() => f.free(side) && f.free(loser))
    f.close(side, 4)
    f.hit(side, 'standingHeavy')
  }
  f.until(() => f.free(side) && f.free(loser))
  f.close(side, 4)
  f.hit(side, 'neutralSpecial')
  const sunApplied = f.state[loser].hatsuEffects.sunMark > 0
  f.until(() => f.free(side) && f.free(loser))
  f.hit(side, 'downSpecial')
  f.until(() => f.free(side) && f.free(loser))
  f.close(side, 4)
  f.hit(side, 'finisher')
  f.until(() => f.state.phase === 'finished')
  if (f.state.winner !== side || f.state[loser].health !== 0 || !sunApplied)
    throw new Error(
      `Chrollo requires a native Sun/Moon knockout: ${JSON.stringify({ winner: f.state.winner, health: f.state[loser].health, sunApplied, book: f.state[side].chrolloBook, aura: f.state[side].aura, last: f.audit.slice(-4) })}`,
    )
  return {
    state: f.state,
    report: {
      ...f.report(),
      frameCount: 600,
      duration: 10,
      character: 'Chrollo',
      target,
      stageId,
      winner: side,
      sunApplied,
      nativeFinalMove: f.state.impact?.kind,
      source:
        'Native production Sun/Moon verdict, followed by a cosmetic Indoor Fish combination. No cinematic damage or prepared room is added to the engine.',
      victory: {
        summonFrame: 66,
        biteFrames: [204, 246, 288, 330],
        fishCount: 2,
        collisionFrame: 390,
        bookClosedFrame: 390,
        announcementFrame: 480,
      },
    },
  }
}
