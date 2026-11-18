import { ContinuousDirector } from './continuousDirector'
import { askLynchQuestion } from '../../src/lib/fighting/lynchAction'
import { privateLynchReplies } from '../../src/lib/fighting/lynchInterrogation'
import { lynchTargetConscious } from '../../src/lib/fighting/lynchRules'
import { performAuraAttack } from '../../src/lib/fighting/engine'
import { LYNCH_TIMING } from '../../src/lib/fighting/victory/lynchTiming'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

function interrogate(f: ContinuousDirector, side: FightSide) {
  const other = side === 'player' ? 'opponent' : 'player'
  f.until(() => f.free(side) && f.free(other), 300)
  f.close(side, 5)
  f.state = askLynchQuestion({ state: f.state, side, question: 'identity' }, performAuraAttack)
  const answers = []
  for (let i = 0; i < 6; i++) {
    f.until(() => f.free(side) && f.free(other), 300)
    f.close(side, 5)
    const before = privateLynchReplies(f.state, side).at(-1)?.frame
    f.hit(side, 'standingLight')
    const reply = privateLynchReplies(f.state, side).at(-1)
    if (!reply || reply.frame === before || !lynchTargetConscious(f.state[other]))
      throw new Error('Lynch requires six real conscious fist-contact replies')
    answers.push(reply)
  }
  return answers
}
export function createLynchFilm(
  options: { target?: FighterId; side?: FightSide; stageId?: FightStageId } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const target = options.target ?? 'hisoka',
    stageId = options.stageId ?? 'vip-casino'
  const loser = side === 'player' ? 'opponent' : 'player'
  f.cut({
    player: side === 'player' ? 'lynch' : target,
    opponent: side === 'player' ? target : 'lynch',
    stageId,
    gap: 5,
    title: 'LYNCH',
    subtitle: 'Le dernier aveu',
    tags: [],
    ren: false,
  })
  f.advance()
  const answers = interrogate(f, side)
  for (let i = 0; f.state.phase === 'fighting' && i < 60; i++) {
    f.until(() => f.free(side) && f.free(loser), 300)
    f.close(side, 5)
    f.hit(side, 'standingHeavy')
  }
  const privateAnswers = privateLynchReplies(f.state).length === 0
  const noReplyAfterKo = privateLynchReplies(f.state, side).every((r) => r.frame < f.state.frame)
  if (f.state.winner !== side || f.state[loser].health !== 0 || !privateAnswers || !noReplyAfterKo)
    throw new Error(
      'Lynch demo requires a native physical knockout and no answer from an unconscious body',
    )
  return {
    state: f.state,
    report: {
      ...f.report(),
      duration: 10,
      frameCount: 600,
      hero: 'lynch',
      target,
      stageId,
      winner: side,
      answers: answers.length,
      truthfulIdentity: answers.every((r) => r.identity === target),
      consciousAnswers: true,
      privateAnswers,
      noReplyAfterKo,
      physicalKnockout: true,
      soulDamage: false,
      futureReading: false,
      timings: LYNCH_TIMING,
      source:
        'A spoken native identity question precedes six real conscious fist contacts and their private replies. Ordinary heavy punches earn the knockout; the final blow extracts no answer. The post-verdict reenactment shows only the already-public roster name from the listener’s perspective, no private Nen state, soul extraction, defence penalty or predicted action.',
    },
  }
}
