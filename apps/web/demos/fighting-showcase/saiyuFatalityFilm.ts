import { ContinuousDirector } from './continuousDirector'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

/** Three separate confirmed monkey hits precede the actual native staff finisher. */
export function createSaiyuFatalityFilm(
  options: { target?: FighterId; stageId?: FightStageId; side?: FightSide } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const target = options.target ?? 'hisoka',
    stageId = options.stageId ?? 'heavens-arena'
  const loser = side === 'player' ? 'opponent' : 'player'
  f.cut({
    player: side === 'player' ? 'saiyu' : target,
    opponent: side === 'player' ? target : 'saiyu',
    stageId,
    gap: 4,
    title: 'SAIYU — LES TROIS SILENCES',
    subtitle: 'Mizaru · Kikazaru · Iwazaru',
    tags: ['TROIS SENS'],
    ren: false,
  })
  f.advance()
  const senses: number[] = []
  for (const slot of ['neutralSpecial', 'forwardSpecial', 'downSpecial'] as const) {
    f.until(() => f.free(side) && f.free(loser))
    f.close(side, 4)
    f.hit(side, slot)
    f.advance(45)
    senses.push(f.state[loser].hatsuEffects.senseSeals)
  }
  for (let i = 0; f.state.phase === 'fighting' && f.state[loser].health > 60 && i < 40; i++) {
    f.until(() => f.free(side) && f.free(loser))
    f.close(side, 4)
    f.hit(side, 'standingHeavy')
  }
  for (let i = 0; f.state.phase === 'fighting' && f.state[loser].health > 30 && i < 8; i++) {
    f.until(() => f.free(side) && f.free(loser))
    f.close(side, 2)
    f.hit(side, 'standingLight')
  }
  f.ready(side)
  f.held[side] = { down: true, aura: true }
  f.until(() => f.state[side].aura >= 99, 600)
  f.held[side] = {}
  f.close(side, 4)
  f.until(() => f.free(side) && f.free(loser))
  f.hit(side, 'finisher')
  f.until(() => f.state.phase === 'finished', 180)
  const staffDeath = f.states.some(
    (s, i) =>
      i > 0 &&
      f.states[i - 1][loser].health > 0 &&
      s[loser].health === 0 &&
      s[side].attack?.moveId === 'saiyu:finisher',
  )
  if (senses.join(',') !== '1,3,7' || !staffDeath || f.state.winner !== side)
    throw new Error(
      `Native Saiyu sequence required: ${JSON.stringify({ senses, staffDeath, winner: f.state.winner, health: f.state[loser].health, aura: f.state[side].aura, reason: f.state.finishReason, frame: f.state.frame })}`,
    )
  return {
    state: f.state,
    report: {
      ...f.report(),
      frameCount: 600,
      duration: 10,
      character: 'Saiyu',
      target,
      stageId,
      winner: side,
      senses,
      staffDeath,
      victory: {
        senseFrames: [90, 162, 234],
        windFrame: 282,
        impactFrame: 360,
        portraitFrame: 438,
      },
      source:
        'Three distinct native monkey hits seal sight, hearing and speech before a real staff-finisher knockout. The cinematic changes no health, sense bits or Nen mode. Functional Nen signs do not invent unrevealed creature anatomy.',
    },
  }
}
