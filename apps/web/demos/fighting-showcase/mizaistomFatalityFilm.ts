import { ContinuousDirector } from './continuousDirector'
import { CROSS_GAME_DISPLAY, CROSS_GAME_RESTRAINT } from '../../src/lib/fighting/crossGame'
import { MIZAISTOM_TIMING } from '../../src/lib/fighting/victory/mizaistomTrack'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

export function createMizaistomFilm(
  options: { target?: FighterId; side?: FightSide; stageId?: FightStageId } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const target = options.target ?? 'zakuro',
    stageId = options.stageId ?? 'supreme-court'
  const loser = side === 'player' ? 'opponent' : 'player'
  f.cut({
    player: side === 'player' ? 'mizaistom' : target,
    opponent: side === 'player' ? target : 'mizaistom',
    stageId,
    gap: 16,
    title: 'MIZAISTOM',
    subtitle: 'Dernier avertissement',
    tags: [],
    ren: false,
  })
  f.advance()
  const health = [f.state.player.health, f.state.opponent.health]
  const proofs = []
  for (let i = 0; i < 2; i++) {
    f.move(side, 'neutralSpecial')
    const warning = f.state[loser].crossGame?.phase === 'warning'
    f.advance(CROSS_GAME_DISPLAY + 1)
    const compliant = f.state[loser].crossGame?.phase === 'warning'
    f.move(loser, 'standingLight')
    const violation = f.state[loser].crossGame?.phase === 'restrained'
    const noAttack = !f.state[loser].attack
    const harmless = health[0] === f.state.player.health && health[1] === f.state.opponent.health
    f.advance(CROSS_GAME_RESTRAINT + 1)
    const released = !f.state[loser].crossGame
    if (!warning || !compliant || !violation || !noAttack || !harmless || !released)
      throw new Error(
        'Native Cross Game warning, disobedience and brief harmless restraint required',
      )
    proofs.push({ warning, compliant, violation, noAttack, harmless, released })
  }
  for (let i = 0; f.state.phase === 'fighting' && i < 90; i++) {
    f.until(() => f.free(side) && f.free(loser), 300)
    f.close(side, 4)
    f.hit(side, 'standingHeavy')
  }
  if (f.state.winner !== side || f.state[loser].health !== 0)
    throw new Error('Native physical knockout required')
  return {
    state: f.state,
    report: {
      ...f.report(),
      duration: 10,
      frameCount: 600,
      hero: 'mizaistom',
      target,
      stageId,
      winner: side,
      proofs,
      restraintDamage: 0,
      physicalKnockout: true,
      redCardExecution: false,
      timings: MIZAISTOM_TIMING,
      source:
        'Two native warnings permit obedience, then deliberate attacks trigger brief harmless restraint. Ordinary physical blows earn the knockout. The post-verdict choreography interleaves two 90-frame confinements with strikes after release and a physical breakaway panel. No lethal red-card effect or damaging cage is added to the simulation.',
    },
  }
}
