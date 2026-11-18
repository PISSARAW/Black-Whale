import { ContinuousDirector } from './continuousDirector'
import { commandMary } from '../../src/lib/fighting/bloodyMaryAction'
import { performAuraAttack } from '../../src/lib/fighting/engine'
import { maryState, MARY_SLAM_NOTICE } from '../../src/lib/fighting/bloodyMary'
import { maryHasInfusion } from '../../src/lib/fighting/bloodyMaryEquipment'
import { ZAKURO_TIMING } from '../../src/lib/fighting/victory/zakuroPose'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

function captureSlam(f: ContinuousDirector, side: FightSide) {
  const other = side === 'player' ? 'opponent' : 'player'
  f.until(() => f.free(side) && f.free(other) && !maryState(f.state[side]).tendril, 300)
  f.close(side, 8)
  f.move(side, 'neutralSpecial')
  f.until(() => Boolean(f.state[other].maryCapture), 100)
  const caught = f.state[other].maryCapture?.owner === side
  const health = f.state[other].health
  f.advance(MARY_SLAM_NOTICE)
  f.move(side, 'forwardSpecial')
  const damage = health - f.state[other].health
  if (!caught || damage <= 0)
    throw new Error('Native travelling blood capture and physical slam required')
  return damage
}
export function createZakuroFilm(
  options: { target?: FighterId; side?: FightSide; stageId?: FightStageId } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const target = options.target ?? 'luini',
    stageId = options.stageId ?? 'whale-hold'
  const loser = side === 'player' ? 'opponent' : 'player'
  f.cut({
    player: side === 'player' ? 'zakuro' : target,
    opponent: side === 'player' ? target : 'zakuro',
    stageId,
    gap: 8,
    title: 'ZAKURO',
    subtitle: 'La dernière goutte',
    tags: [],
    ren: false,
  })
  f.advance()
  const equipped = maryHasInfusion(f.state[side]),
    initial = f.state[side].health
  f.state = commandMary({ state: f.state, side, command: 'bleed' }, performAuraAttack)
  f.advance()
  const ownWound = (f.state[side].openWounds ?? 0) > 0 && f.state[side].health < initial
  const victimHealth = f.state[loser].health
  f.move(side, 'downSpecial')
  f.advance(36)
  const scouts = maryState(f.state[side]).drops.length === 3
  const harmlessScouts = f.state[loser].health === victimHealth
  f.move(side, 'backSpecial')
  f.until(() => maryState(f.state[side]).drops.length === 0, 300)
  const returned = maryState(f.state[side]).available === 6
  const slamDamage = captureSlam(f, side)
  for (
    let i = 0;
    f.state.phase === 'fighting' && f.state[loser].health > slamDamage && i < 90;
    i++
  ) {
    f.until(() => f.free(side) && f.free(loser), 300)
    f.close(side, 5)
    f.hit(side, f.state[loser].health > 32 ? 'standingHeavy' : 'standingLight')
  }
  if (f.state.phase === 'fighting') captureSlam(f, side)
  const noHealing = f.state[side].health === initial - 2
  if (
    !equipped ||
    !ownWound ||
    !scouts ||
    !harmlessScouts ||
    !returned ||
    !noHealing ||
    f.state.winner !== side ||
    f.state[loser].health !== 0
  )
    throw new Error(
      JSON.stringify({
        equipped,
        ownWound,
        scouts,
        harmlessScouts,
        returned,
        noHealing,
        winner: f.state.winner,
        health: f.state[loser].health,
        ownHealth: f.state[side].health,
        initial,
        phase: f.state.phase,
        impact: f.state.impact,
      }),
    )
  return {
    state: f.state,
    report: {
      ...f.report(),
      duration: 10,
      frameCount: 600,
      hero: 'zakuro',
      target,
      stageId,
      winner: side,
      equipped,
      ownWound,
      scouts,
      harmlessScouts,
      returned,
      noHealing,
      slamDamage,
      finalSlam: f.state.impact?.kind === 'heavy',
      physicalKnockout: true,
      enemyBloodControlled: false,
      timings: ZAKURO_TIMING,
      source:
        'A real carried infusion kit and own wound supply three harmless scouting drops. Native recall restores that finite supply without healing; a travelling tendril catches before a real ground slam. Ordinary physical combat prepares the final native Bloody Mary slam. The two cinematic hoists and floor impacts are post-verdict exaggeration, without enemy-blood control, exsanguination or forced Zetsu.',
    },
  }
}
