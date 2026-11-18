import { ContinuousDirector } from './continuousDirector'
import { createBattlefield, readyCohort } from '../../src/lib/fighting/preparationWorld'
import { COHORT_WILL_FRAMES } from '../../src/lib/fighting/preparationTuning'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

/** Prepare real shared will, then earn the verdict physically: Grimmel itself deals no damage. */
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
  prepareCohort(f, side)
  for (let i = 0; f.state.phase === 'fighting' && i < 65; i++) {
    f.until(() => f.free(side) && f.free(loser))
    f.close(side, 4)
    f.hit(side, 'standingHeavy')
  }
  const last = f.audit.filter((event) => event.kind === 'impact').at(-1)
  if (f.state.winner !== side || f.state[loser].health !== 0 || f.state[side].id !== 'halkenburg')
    throw new Error(
      `Halkenburg requires a native physical knockout: ${JSON.stringify({ winner: f.state.winner, health: f.state[loser].health, fighter: f.state[side].id })}`,
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
      nativeFrameCount: f.states.length,
      nativeFinalMove: last?.move,
      consentingSupporters: readyCohort(f.state, side).length,
      cohortWillFrames: f.state[side].hatsuEffects.cohortWillFrames,
      chosenSupporter: f.state[side].halkenburgSupporter,
      possessionFrames: f.state[loser].hatsuEffects.possessedFrames,
      source:
        'Uninterrupted production duel with three consenting feather bearers and fully gathered shared will. A physical strike earns the knockout. Grimmel deals no damage; the following ten-second victory presentation illustrates the arrow and consciousness transfer without changing the native verdict, bodies or abilities.',
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

function prepareCohort(f: ContinuousDirector, side: FightSide): void {
  f.state.environment = {
    ...f.state.environment,
    preparation: { mode: 'scenario', resources: [], cohorts: [side] },
  }
  f.state.battlefield = createBattlefield(f.state.environment)
  f.until(
    () => f.state[side].hatsuEffects.cohortWillFrames >= COHORT_WILL_FRAMES,
    COHORT_WILL_FRAMES,
  )
  if (
    readyCohort(f.state, side).length !== 3 ||
    f.state[side].hatsuEffects.cohortWillFrames < COHORT_WILL_FRAMES
  )
    throw new Error('Halkenburg requires three consenting feather bearers and fully gathered will')
}
