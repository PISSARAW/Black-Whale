import { ContinuousDirector } from './continuousDirector'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

/** The production engine must award the win before the cinematic starts. */
export function createBenjaminFatalityFilm(
  options: { target?: FighterId; stageId?: FightStageId; side?: FightSide } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const target = options.target ?? 'tserriednich',
    loser = side === 'player' ? 'opponent' : 'player'
  const stageId = options.stageId ?? 'benjamin-salon'
  f.cut({
    player: side === 'player' ? 'benjamin' : target,
    opponent: side === 'player' ? target : 'benjamin',
    stageId,
    gap: 4,
    title: 'BENJAMIN — LE DERNIER ORDRE',
    subtitle: 'L’héritage des soldats.',
    tags: ['BENJAMIN BATON', 'AIR BLOW'],
    ren: false,
  })
  f.advance()
  for (let attempts = 0; f.state.phase === 'fighting' && attempts < 70; attempts++) {
    f.until(() => f.free(side) && f.free(loser))
    if (f.state[side].aura < 30) {
      f.held[side] = { down: true, aura: true }
      f.until(() => f.state[side].aura >= 99, 600)
      f.held[side] = {}
      f.advance()
    }
    f.close(side, 4)
    f.hit(side, 'neutralSpecial')
    f.until(() => f.free(side) && f.free(loser), 150)
  }
  const impacts = f.audit.filter((event) => event.kind === 'impact')
  const last = impacts.at(-1)
  if (
    f.state.winner !== side ||
    f.state[loser].health !== 0 ||
    last?.move !== 'benjamin:neutralSpecial'
  )
    throw new Error(`Benjamin must win with native Air Blow: ${JSON.stringify(f.report())}`)
  return {
    state: f.state,
    report: {
      ...f.report(),
      nativeFrameCount: f.states.length,
      frameCount: 600,
      duration: 10,
      character: 'Benjamin',
      target,
      stageId,
      winner: side,
      strikingHand: 'left',
      nativeFinalMove: last.move,
      inheritance: f.state[side].hatsuEffects.baton?.inherited,
      source:
        'Uninterrupted production duel. Native left-palm Air Blow awards the knockout. The following ten seconds use the live adaptive victory renderer; the soldier echo and target dispersion are cosmetic cinematic exaggerations.',
      victory: {
        inheritanceFrame: 62,
        transferFrame: 130,
        marchFrame: 190,
        impactFrame: 270,
        dispersionFrame: 283,
        targetGoneFrame: 336,
        saluteFrame: 387,
        announcementFrame: 420,
      },
    },
  }
}
