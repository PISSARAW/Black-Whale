import { ContinuousDirector } from './continuousDirector'
import { createBattlefield, readyCohort } from '../../src/lib/fighting/preparationWorld'
import { COHORT_WILL_FRAMES } from '../../src/lib/fighting/preparationTuning'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

/** Explicit consenting cohort at setup; the production engine charges and resolves Grimmel. */
export function createHalkenburgFatalityFilm(
  options: { target?: FighterId; stageId?: FightStageId; side?: FightSide } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const target = options.target ?? 'hisoka',
    loser = side === 'player' ? 'opponent' : 'player'
  const stageId = options.stageId ?? 'halkenburg-salon'
  f.cut({
    player: side === 'player' ? 'halkenburg' : target,
    opponent: side === 'player' ? target : 'halkenburg',
    stageId,
    gap: 4,
    title: 'HALKENBURG — UNE SEULE VOLONTÉ',
    subtitle: 'Grimmel the Dissonance',
    tags: ['SHARED WILL', 'GRIMMEL'],
    ren: false,
  })
  f.state.environment = {
    ...f.state.environment,
    preparation: { mode: 'scenario', resources: [], cohorts: [side] },
  }
  f.state.battlefield = createBattlefield(f.state.environment)
  const cohort = readyCohort(f.state, side).length
  f.advance()
  for (let i = 0; f.state[loser].health > 18 && i < 65; i++) {
    f.until(() => f.free(side) && f.free(loser))
    f.close(side, 4)
    f.hit(side, 'standingHeavy')
  }
  f.until(() => f.free(side) && f.free(loser))
  f.until(
    () => f.state[side].hatsuEffects.cohortWillFrames >= COHORT_WILL_FRAMES,
    COHORT_WILL_FRAMES,
  )
  f.close(side, 4)
  f.hit(side, 'neutralSpecial')
  f.until(() => f.state.phase === 'finished')
  if (f.state.winner !== side || f.state[loser].health !== 0 || !f.state[side].halkenburgSupporter)
    throw new Error(
      `Halkenburg requires a charged native Grimmel verdict: ${JSON.stringify({ winner: f.state.winner, health: f.state[loser].health, effects: f.state[side].hatsuEffects, supporter: f.state[side].halkenburgSupporter })}`,
    )
  return {
    state: f.state,
    report: {
      ...f.report(),
      frameCount: 600,
      duration: 10,
      character: 'Halkenburg',
      target,
      stageId,
      winner: side,
      consentingSupporters: cohort,
      chosenSupporter: f.state[side].halkenburgSupporter,
      possessionFrames: f.state[loser].hatsuEffects.possessedFrames,
      source:
        'Native shared-will scenario with three consenting feather bearers. The real Grimmel arrow awards the arcade verdict. The following ten seconds portray the consciousness transfer without extra damage or ability acquisition.',
      victory: {
        cohortFrame: 66,
        fullDrawFrame: 258,
        releaseFrame: 300,
        impactFrame: 324,
        transferFrame: 362,
        hostAwakensFrame: 410,
        announcementFrame: 480,
      },
    },
  }
}
