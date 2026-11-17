import { ContinuousDirector } from './continuousDirector'
import type { FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'
import type { BeyondCurseCarrier } from '../../src/lib/fighting/victory/beyondCurseSelection'
import { BEYOND_CURSE_PRINCES } from '../../src/lib/fighting/victory/beyondCurseSelection'
import { BEYOND_CURSE_TIMING } from '../../src/lib/fighting/victory/beyondCursePose'

export function createBeyondCurseFilm(
  options: {
    carrier?: BeyondCurseCarrier
    prince?: (typeof BEYOND_CURSE_PRINCES)[number]
    side?: FightSide
    stageId?: FightStageId
  } = {},
) {
  const f = new ContinuousDirector()
  const side = options.side ?? 'player'
  const loser = side === 'player' ? 'opponent' : 'player'
  const carrier = options.carrier ?? 'furykov',
    prince = options.prince ?? 'benjamin'
  const stageId = options.stageId ?? 'whale-hold'
  f.cut({
    player: side === 'player' ? prince : carrier,
    opponent: side === 'player' ? carrier : prince,
    stageId,
    gap: 4,
    title: 'L’HÉRITAGE DE BEYOND',
    subtitle: 'Nen post mortem',
    tags: [],
    ren: false,
  })
  f.advance()
  for (let i = 0; f.state.phase === 'fighting' && i < 90; i++) {
    f.until(() => f.free(side) && f.free(loser))
    f.close(side, 4)
    f.hit(side, 'standingHeavy')
  }
  const physicalKnockout =
    f.state.winner === side && f.state[loser].health === 0 && f.state.finishReason === 'knockout'
  if (!physicalKnockout) throw new Error('Beyond cinematic requires a native princely knockout')
  return {
    state: f.state,
    report: {
      ...f.report(),
      duration: 10,
      frameCount: 600,
      carrier,
      prince,
      stageId,
      winner: side,
      physicalKnockout,
      fictionalTargetAssignment: true,
      postVerdictOnly: true,
      victory: BEYOND_CURSE_TIMING,
      source:
        'Native physical knockout, followed by an explicitly fictional post-verdict target assignment. The prince was designated before the duel. No damage, resurrection, winner reversal or new Hatsu command is sent to the simulation.',
    },
  }
}
