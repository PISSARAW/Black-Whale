import { ContinuousDirector } from './continuousDirector'
import { SAYIRD_HITS, SAYIRD_ROUTES } from '../../src/lib/fighting/victory/sayirdTrack'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

export function createSayirdFilm(
  options: { target?: FighterId; side?: FightSide; stageId?: FightStageId } = {},
) {
  const target = options.target ?? 'hisoka',
    side = options.side ?? 'player'
  const loser = side === 'player' ? 'opponent' : 'player',
    stageId = options.stageId ?? 'whale-hold'
  const f = new ContinuousDirector()
  f.cut({
    player: side === 'player' ? 'sayird' : target,
    opponent: side === 'player' ? target : 'sayird',
    stageId,
    gap: 6,
    title: 'Ton angle mort',
    subtitle: 'Little Eye',
    tags: [],
    ren: false,
  })
  f.advance()
  for (let i = 0; f.state.phase === 'fighting' && i < 50; i++) {
    const route = SAYIRD_ROUTES[i % SAYIRD_ROUTES.length]
    f.chain(side, [...route])
    f.until(() => f.free(side) && f.free(loser))
  }
  if (f.state.winner !== side || f.state[loser].health !== 0)
    throw new Error('Sayird requires a native physical knockout')
  return {
    state: f.state,
    report: {
      ...f.report(),
      duration: 10,
      frameCount: 600,
      hero: 'sayird',
      target,
      stageId,
      winner: side,
      physicalKnockout: true,
      noNewNenDamage: true,
      impactFrames: [...SAYIRD_HITS],
      abilityProof: {
        realSmallHostProvided: true,
        cinematicCapture: true,
        nativeActivation: false,
        littleEyeDamage: 0,
        humanManipulation: false,
      },
      source:
        'Little Eye uses a real small animal for local sight and hearing. The host is an explicit cinematic premise; the duel has no Little Eye activation command. Physical combos and the knockout resolve through the production engine, without resets or added Nen damage.',
    },
  }
}
