import { ContinuousDirector } from './continuousDirector'
import { performMove } from '../../src/lib/fighting/engine'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

/** Actual Skill 4 activation, freely controlled double, rejected remote recall and projected choke. */
export function createHanzoFatalityFilm(
  options: { target?: FighterId; stageId?: FightStageId; side?: FightSide } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const loser = side === 'player' ? 'opponent' : 'player'
  const target = options.target ?? 'benjamin',
    stageId = options.stageId ?? 'whale-hold'
  f.cut({
    player: side === 'player' ? 'hanzo' : target,
    opponent: side === 'player' ? target : 'hanzo',
    stageId,
    gap: 5,
    title: 'HANZO — DERRIÈRE TOI',
    subtitle: 'Hanzo Skill 4',
    tags: ['DOUBLE ASTRAL'],
    ren: false,
  })
  f.advance()
  for (let i = 0; f.state.phase === 'fighting' && f.state[loser].health > 25 && i < 50; i++) {
    f.until(() => f.free(side) && f.free(loser))
    f.close(side, 3)
    f.hit(side, f.state[loser].health > 70 ? 'standingHeavy' : 'standingLight')
  }
  f.until(() => f.free(side) && f.free(loser))
  f.retreat(side, 180)
  const targetX = side === 'player' ? 55 : 45
  f.held[loser] = { [f.state[loser].x > targetX ? 'left' : 'right']: true }
  f.until(() => Math.abs(f.state[loser].x - targetX) < 0.5, 240)
  f.held[loser] = {}
  f.hit(side, 'neutralSpecial')
  f.advance(24)
  const bodyX = f.state[side].hanzoProjection?.bodyX
  const direction = f.state[side].x < f.state[loser].x ? 1 : -1
  f.held[side] = { [direction === 1 ? 'right' : 'left']: true, jump: true }
  f.advance(8)
  const hovered = f.state[side].y > 0
  f.held[side] = { [direction === 1 ? 'right' : 'left']: true }
  f.until(() => (f.state[side].x - f.state[loser].x) * direction > 2.5, 240)
  f.held[side] = { down: true }
  f.until(() => f.state[side].y === 0)
  f.held[side] = {}
  const crossed = (f.state[side].x - f.state[loser].x) * direction > 0
  const sleepingBodyFixed = bodyX !== undefined && f.state[side].hanzoProjection?.bodyX === bodyX
  const beforeRecall = f.state
  f.state = performMove({ state: f.state, side, action: 'special' })
  const distantRecallRejected = f.state === beforeRecall
  f.close(side, 2.8)
  f.hit(side, 'finisher')
  const projectedChoke = f.states.some(
    (state, i) =>
      i > 0 &&
      state[loser].health === 0 &&
      f.states[i - 1][loser].health > 0 &&
      f.states[i - 1][side].hanzoProjection &&
      f.states[i - 1][side].attack?.moveId === 'hanzo:finisher',
  )
  if (
    !hovered ||
    !crossed ||
    !sleepingBodyFixed ||
    !distantRecallRejected ||
    !projectedChoke ||
    f.state.winner !== side
  )
    throw new Error(
      `Hanzo requires native Skill 4 and a projected choke: ${JSON.stringify({ hovered, crossed, sleepingBodyFixed, distantRecallRejected, projectedChoke, winner: f.state.winner, health: f.state[loser].health, aura: f.state[side].aura })}`,
    )
  return {
    state: f.state,
    report: {
      ...f.report(),
      frameCount: 600,
      duration: 10,
      character: 'Hanzo',
      target,
      stageId,
      winner: side,
      hovered,
      crossed,
      sleepingBodyFixed,
      distantRecallRejected,
      projectedChoke,
      victory: {
        projectionFrame: 72,
        phaseFrame: 138,
        contactFrame: 216,
        deathFrame: 360,
        releaseFrame: 384,
        returnFrame: 468,
        wakeFrame: 486,
        portraitFrame: 516,
      },
      source:
        'An uninterrupted native fight prepares the target with physical blows, activates Skill 4, hovers and crosses the opponent while the vulnerable body remains fixed, rejects recall away from the body and wins through the projected close-range choke. The engine closes projection at the verdict; the post-verdict film reconstructs a continuous return into the body without adding damage, invulnerability or remote recall.',
    },
  }
}
