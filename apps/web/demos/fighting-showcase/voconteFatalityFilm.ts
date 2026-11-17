import { ContinuousDirector } from './continuousDirector'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

export function createVoconteFatalityFilm(
  options: { target?: FighterId; stageId?: FightStageId; side?: FightSide } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const loser = side === 'player' ? 'opponent' : 'player'
  const target = options.target ?? 'terebellum',
    stageId = options.stageId ?? 'whale-hold'
  f.cut({
    player: side === 'player' ? 'voconte' : target,
    opponent: side === 'player' ? target : 'voconte',
    stageId,
    gap: 6,
    title: 'VOCONTE — ALLER SIMPLE',
    subtitle: 'Door',
    tags: ['DOOR'],
    ren: false,
  })
  // Initial placement precedes the first recorded tick; all later travel is native movement.
  f.state[side].x = 20
  f.state[loser].x = 26
  f.advance()
  const health = [f.state.player.health, f.state.opponent.health]
  f.hit(side, 'neutralSpecial')
  const linked = f.state.voconteDoors?.networks[side]?.active === true
  f.held[loser] = { right: true }
  f.until(() => f.state.voconteDoors?.lastTransit?.[loser]?.from === 'A', 360)
  f.held[loser] = {}
  const firstPassage = f.state.voconteDoors?.lastTransit?.[loser]?.to === 'B'
  f.held[side] = { right: true }
  f.until(() => f.state.voconteDoors?.lastTransit?.[side]?.from === 'A', 360)
  f.held[side] = {}
  const heroFirstPassage = f.state.voconteDoors?.lastTransit?.[side]?.to === 'B'
  // The target jumps clear of the threshold so both native bodies have room to return.
  f.held[loser] = { jump: true }
  f.held[side] = { right: true }
  f.advance(16)
  f.held[loser] = {}
  f.held[side] = { left: true }
  f.until(() => f.state.voconteDoors?.lastTransit?.[side]?.from === 'B', 360)
  f.held[side] = {}
  const heroReturn = f.state.voconteDoors?.lastTransit?.[side]?.to === 'A'
  f.until(() => f.state[loser].y === 0)
  f.held[loser] = { left: true }
  f.until(() => f.state.voconteDoors?.lastTransit?.[loser]?.from === 'B', 360)
  f.held[loser] = {}
  const returnPassage = f.state.voconteDoors?.lastTransit?.[loser]?.to === 'A'
  const harmless = health[0] === f.state.player.health && health[1] === f.state.opponent.health
  f.hit(side, 'neutralSpecial')
  const closed = !f.state.voconteDoors?.networks[side]?.active
  for (let i = 0; f.state.phase === 'fighting' && i < 60; i++) {
    f.until(() => f.free(side) && f.free(loser))
    f.close(side, 4)
    f.hit(side, 'standingHeavy')
  }
  const physicalKnockout = f.state.winner === side && f.state[loser].health === 0
  if (
    !heroFirstPassage ||
    !heroReturn ||
    !linked ||
    !firstPassage ||
    !returnPassage ||
    !harmless ||
    !closed ||
    !physicalKnockout
  )
    throw new Error(
      `Native Door verdict required: ${JSON.stringify({ linked, firstPassage, returnPassage, harmless, closed, physicalKnockout, heroFirstPassage, heroReturn, transit: f.state.voconteDoors?.lastTransit })}`,
    )
  return {
    state: f.state,
    report: {
      ...f.report(),
      duration: 10,
      frameCount: 600,
      character: 'Voconte',
      target,
      stageId,
      winner: side,
      linked,
      firstPassage,
      returnPassage,
      harmless,
      closed,
      physicalKnockout,
      heroFirstPassage,
      heroReturn,
      victory: {
        heroPassageFrame: 90,
        targetPassageFrame: 156,
        fallFrame: 186,
        heroReturnFrame: 246,
        closingFrame: 420,
        portraitFrame: 486,
      },
      source:
        'One uninterrupted native fight proves that both whole living bodies traverse the prepared directional thresholds, with no teleport damage, then ends in a physical knockout. After the verdict, an anchored elevated exit stages a prepared fall trap. The scene does not add portal cutting, airborne gates, auto-dodges, ranged weapon transport or a new combat damage rule.',
    },
  }
}
