import { ContinuousDirector } from './continuousDirector'
import { toggleEmperorTime } from '../../src/lib/fighting/kurapikaActions'
import { performArsenalCommand } from '../../src/lib/fighting/retrospectiveArsenal'
import { troupeMember } from '../../src/lib/fighting/troupeMembership'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

/** Judgment implantation does not kill; a deliberate forbidden Nen input must trigger the verdict. */
export function createKurapikaJudgmentFilm(
  options: { target?: FighterId; stageId?: FightStageId; side?: FightSide } = {},
) {
  const side = options.side ?? 'player',
    loser = side === 'player' ? 'opponent' : 'player'
  const target = options.target ?? 'hisoka',
    stageId = options.stageId ?? 'whale-hold'
  if (troupeMember(target))
    throw new Error('This showcase is for non-Troupe Judgment Chain targets')
  const f = new ContinuousDirector()
  f.cut({
    player: side === 'player' ? 'kurapika' : target,
    opponent: side === 'player' ? target : 'kurapika',
    stageId,
    gap: 5,
    title: 'KURAPIKA — LA DERNIÈRE CONDITION',
    subtitle: 'Judgment Chain',
    tags: ['HORS BRIGADE'],
    ren: false,
  })
  f.state = performArsenalCommand(f.state, side, { action: 'judgment-preset', target: 'nen' })
  f.state = toggleEmperorTime(f.state, side)
  f.advance()
  const health = f.state[loser].health
  f.hit(side, 'finisher')
  f.advance(90)
  const implanted = f.state[loser].judgmentChain?.owner === side
  const harmlessImplant = health === f.state[loser].health
  const forbidden = f.state[loser].judgmentChain?.rule === 'zetsu'
  f.held[loser] = { focusHands: true }
  f.advance(1)
  f.held[loser] = {}
  const noChainJail = f.states.every((state) => !state[loser].chainJail)
  if (!implanted || !harmlessImplant || !forbidden || !noChainJail || f.state.winner !== side)
    throw new Error(
      `Native Judgment breach required: ${JSON.stringify({ implanted, harmlessImplant, forbidden, noChainJail, winner: f.state.winner, aura: f.state[loser].aura })}`,
    )
  return {
    state: f.state,
    report: {
      ...f.report(),
      frameCount: 600,
      duration: 10,
      character: 'Kurapika',
      target,
      stageId,
      winner: side,
      implanted,
      harmlessImplant,
      forbidden,
      noChainJail,
      victory: {
        implantFrame: 150,
        ruleFrame: 180,
        attemptFrame: 294,
        breachFrame: 348,
        portraitFrame: 444,
        announcementFrame: 480,
      },
      source:
        'One native Emperor Time activation, a declared no-Nen clause and harmless Judgment Chain implantation. The target deliberately focuses aura on their hands and dies through the native rule breach. No Chain Jail, physical binding or stolen ability is used.',
    },
  }
}
