import { ContinuousDirector } from './continuousDirector'
import { machiBindReady } from '../../src/lib/fighting/machiThread'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

/** Tracking, a maintained bind and a real tension finisher precede the cosmetic surgery. */
export function createMachiFatalityFilm(
  options: { target?: FighterId; stageId?: FightStageId; side?: FightSide } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const target = options.target ?? 'hisoka',
    loser = side === 'player' ? 'opponent' : 'player'
  const stageId = options.stageId ?? 'heavens-arena'
  f.cut({
    player: side === 'player' ? 'machi' : target,
    opponent: side === 'player' ? target : 'machi',
    stageId,
    gap: 4,
    title: 'MACHI — LE DERNIER POINT',
    subtitle: 'Nenshi Hōgō',
    tags: ['NEN STITCHES'],
    ren: false,
  })
  f.advance()
  for (let i = 0; f.state[loser].health > 45 && i < 65; i++) {
    f.until(() => f.free(side) && f.free(loser))
    f.close(side, 4)
    f.hit(side, 'standingHeavy')
  }
  f.until(() => f.free(side) && f.free(loser))
  f.hit(side, 'forwardSpecial')
  f.advance(50)
  const tracking = f.state[loser].machiThread?.kind === 'mark'
  let maintainedBind = false
  for (let i = 0; f.state.phase === 'fighting' && i < 4; i++) {
    f.until(() => f.free(side) && f.free(loser))
    if (f.state[side].aura < 65) {
      f.held[side] = { down: true, aura: true }
      f.until(() => f.state[side].aura >= 99, 600)
      f.held[side] = {}
      f.advance()
    }
    f.close(side, 4)
    f.hit(side, 'downSpecial')
    f.ready(side)
    maintainedBind ||= machiBindReady(f.state, side)
    f.hit(side, 'finisher')
    f.advance(75)
  }
  if (!tracking || !maintainedBind || f.state.winner !== side || f.state[loser].health !== 0)
    throw new Error(
      `Machi requires a real tracking mark, maintained bind and tension knockout: ${JSON.stringify({ tracking, maintainedBind, winner: f.state.winner, health: f.state[loser].health, aura: f.state[side].aura })}`,
    )
  return {
    state: f.state,
    report: {
      ...f.report(),
      frameCount: 600,
      duration: 10,
      character: 'Machi',
      target,
      stageId,
      winner: side,
      tracking,
      maintainedBind,
      nativeFinisher: 'machi:finisher',
      source:
        'Native tracking and a short maintained binding resolve the tension-finisher knockout. The subsequent puppet, sectioning and suture are cosmetic after the verdict, without healing or changing the simulation.',
      victory: {
        captureFrame: 72,
        puppetFrame: 126,
        closeFrame: 270,
        cutFrame: 282,
        stitchFrame: 306,
        rejoinFrame: 378,
        unpickFrame: 420,
        fallEndFrame: 486,
        sectionCount: 4,
      },
    },
  }
}
