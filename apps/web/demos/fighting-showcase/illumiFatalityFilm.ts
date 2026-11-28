import { ContinuousDirector } from './continuousDirector'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

function prepareTarget(f: ContinuousDirector, side: FightSide, loser: FightSide) {
  for (let attempt = 0; f.state[loser].health > 55 && attempt < 30; attempt++) {
    f.until(() => f.free(side) && f.free(loser))
    f.close(side, 4.5)
    f.hit(side, 'standingHeavy')
  }
  f.until(() => f.free(side) && f.free(loser))
  f.held[side] = f.direction(side, true)
  f.held[loser] = f.direction(loser)
  f.until(() => Math.abs(f.state[loser].x - 50) <= 5)
  f.held[side] = {}
  f.held[loser] = {}
  f.close(side, 4.5)
}

/** Needle People does not itself deal damage: the native verdict remains a physical knockout. */
export function createIllumiFatalityFilm(
  options: { target?: FighterId; stageId?: FightStageId; side?: FightSide } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const target = options.target ?? 'franklin',
    loser = side === 'player' ? 'opponent' : 'player'
  const stageId = options.stageId ?? 'whale-hold'
  f.cut({
    player: side === 'player' ? 'illumi' : target,
    opponent: side === 'player' ? target : 'illumi',
    stageId,
    gap: 4,
    title: 'ILLUMI — MÊME APRÈS LA MORT',
    subtitle: 'Needle People',
    tags: ['MANIPULATION'],
    ren: false,
  })
  f.advance()
  prepareTarget(f, side, loser)
  const health = f.state[loser].health
  f.hit(side, 'neutralSpecial')
  const implanted =
    f.state[loser].needlePuppet?.owner === side &&
    f.state[loser].needlePuppet?.needleEmbedded === true
  const implantDamage = health - f.state[loser].health
  f.ready(side)
  const beforeRetreat = Math.abs(f.state[side].x - f.state[loser].x)
  f.hit(side, 'downSpecial')
  f.advance(24)
  const retreat = Math.abs(f.state[side].x - f.state[loser].x) > beforeRetreat
  f.hit(side, 'forwardSpecial')
  f.advance(24)
  const approach =
    f.state[loser].needlePuppet?.order === 'approach' &&
    Math.abs(f.state[side].x - f.state[loser].x) <= 6.3
  f.hit(side, 'neutralSpecial')
  const stayed = f.state[loser].needlePuppet?.order === 'stay'
  for (let i = 0; f.state.phase === 'fighting' && i < 65; i++) {
    f.ready(side)
    f.close(side, 4.5)
    f.hit(side, 'standingHeavy')
  }
  if (
    !implanted ||
    implantDamage !== 0 ||
    !retreat ||
    !approach ||
    !stayed ||
    f.state.winner !== side ||
    f.state.finishReason !== 'knockout' ||
    f.state[loser].health !== 0
  )
    throw new Error(
      `Illumi requires native skull implantation and a physical knockout: ${JSON.stringify({ implanted, implantDamage, retreat, approach, stayed, winner: f.state.winner, verdict: f.state.finishReason, health: f.state[loser].health, trace: f.audit.slice(-5) })}`,
    )
  return {
    state: f.state,
    report: {
      ...f.report(),
      frameCount: 600,
      duration: 10,
      character: 'Illumi',
      target,
      stageId,
      winner: side,
      implanted,
      implantDamage,
      retreat,
      approach,
      stayed,
      source:
        'A continuous native fight implants a physical skull needle without dealing damage, demonstrates Retreat, Approach and Stay, then earns a real physical knockout. The post-verdict fatality portrays additional needles, collapse and corpse control without adding damage, a finisher or resurrection to the simulation.',
      victory: {
        implantFrame: 132,
        needleFrames: [282, 300],
        deathFrame: 348,
        riseFrame: 420,
        bowFrame: 468,
      },
    },
  }
}
