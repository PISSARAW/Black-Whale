import { ContinuousDirector } from './continuousDirector'
import { predatorReady } from '../../src/lib/fighting/predator'
import { predatorNenLocked } from '../../src/lib/fighting/predatorSeal'
import { isBodyguardBullet } from '../../src/lib/fighting/bodyguardFirearms'
import { rihanPlan, RIHAN_TIMING } from '../../src/lib/fighting/victory/rihanPlan'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

function study(f: ContinuousDirector, side: FightSide) {
  const other = side === 'player' ? 'opponent' : 'player'
  if (f.state[other].id === 'hisoka') {
    f.close(other, 4)
    f.hit(other, 'neutralSpecial')
    f.until(() => f.free(side) && f.free(other))
    f.move(side, 'neutralSpecial')
    f.until(() => predatorReady(f.state, side), 240)
    return
  }
  f.move(side, 'neutralSpecial')
  for (let cast = 0; cast < 18; cast++) {
    f.until(() => f.free(other), 300)
    if (f.state[other].aura < 45) {
      f.held[other] = { down: true, aura: true }
      f.until(() => f.state[other].aura >= 85, 900)
      f.held[other] = {}
      f.advance()
    }
    f.move(other, 'neutralSpecial')
    for (let frame = 0; frame < 100; frame++) {
      f.advance()
      if (predatorReady(f.state, side) && f.state[other].hatsuEffects.blinkyFrames > 16) return
      if (!f.state[other].attack) break
    }
  }
  throw new Error('Native study requires a live manifestation, not guessed knowledge')
}
function hunt(f: ContinuousDirector, side: FightSide) {
  const other = side === 'player' ? 'opponent' : 'player'
  study(f, side)
  const studied = f.state[side].predator?.analysis
  const health = [f.state.player.health, f.state.opponent.health]
  f.move(side, 'finisher')
  const launched = Boolean(f.state[side].predator?.hunt)
  f.until(() => predatorNenLocked(f.state[side]), 180)
  const sealed = predatorNenLocked(f.state[side]) && f.state[side].nen.mode === 'zetsu'
  const harmless = health[0] === f.state.player.health && health[1] === f.state.opponent.health
  const enemyNotSealed = f.state[other].nen.mode !== 'zetsu'
  if (!launched || !sealed || !harmless || !enemyNotSealed)
    throw new Error('Native harmless predation and self-seal required')
  return {
    prey: studied?.preyId,
    observedFrames: studied?.observedFrames,
    launched,
    sealed,
    harmless,
    enemyNotSealed,
  }
}
export function createRihanFilm(
  options: { target?: FighterId; side?: FightSide; stageId?: FightStageId } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const target = options.target ?? 'shizuku',
    stageId = options.stageId ?? 'whale-hold'
  const loser = side === 'player' ? 'opponent' : 'player',
    plan = rihanPlan(target)
  f.cut({
    player: side === 'player' ? 'rihan' : target,
    opponent: side === 'player' ? target : 'rihan',
    stageId,
    gap: 8,
    title: 'RIHAN',
    subtitle: 'L’angle mort',
    tags: [],
    ren: false,
  })
  f.advance()
  const proof = plan.prey ? hunt(f, side) : null
  let physicalBullet = false
  for (let shot = 0; f.state.phase === 'fighting' && shot < 80; shot++) {
    f.until(() => f.free(side) && f.free(loser), 300)
    f.close(side, 10)
    if (!plan.prey && shot > 0) {
      f.close(side, 4)
      f.hit(side, 'standingHeavy')
      continue
    }
    f.ranged(side)
    f.until(() => f.state.projectiles.some(isBodyguardBullet) || !f.state[side].attack)
    physicalBullet ||= f.state.projectiles.some(isBodyguardBullet)
    f.until(
      () => f.state.phase === 'finished' || (!f.state.projectiles.length && f.free(side)),
      300,
    )
  }
  if (!physicalBullet || f.state.winner !== side || f.state[loser].health !== 0)
    throw new Error('Native physical-pistol victory required')
  return {
    state: f.state,
    report: {
      ...f.report(),
      duration: 10,
      frameCount: 600,
      hero: 'rihan',
      target,
      stageId,
      winner: side,
      proof,
      physicalBullet,
      predationDamage: 0,
      enemyZetsu: false,
      timings: RIHAN_TIMING,
      source:
        'The native engine personally studies and consumes a live, supported manifestation, with no predation damage or enemy Zetsu. Rihan pays his own 48-hour Nen seal before winning with an ordinary service pistol. The film uses fictional tailored beast designs for Blinky and Bungee Gum. Other matchups retain a physical ending, without inventing an eligible prey.',
    },
  }
}
