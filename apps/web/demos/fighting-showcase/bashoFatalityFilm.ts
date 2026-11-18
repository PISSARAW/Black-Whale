import { ContinuousDirector } from './continuousDirector'
import {
  BASHO_FIRE_FRAMES,
  BASHO_POEMS,
  BASHO_WRITING_FRAMES,
  recognizedBashoPoem,
} from '../../src/lib/fighting/bashoPoem'
import { composeBashoPoem } from '../../src/lib/fighting/bashoAction'
import { performAuraAttack } from '../../src/lib/fighting/engine'
import { hatsuDefenceFactor } from '../../src/lib/fighting/hatsu'
import { nenDamageFactor } from '../../src/lib/fighting/nen'
import { BASHO_TIMING } from '../../src/lib/fighting/victory/bashoTrack'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

function ready(f: ContinuousDirector, side: FightSide) {
  const other = side === 'player' ? 'opponent' : 'player'
  f.until(() => f.free(side) && f.free(other), 300)
  f.close(side, 5)
}
function prepare(f: ContinuousDirector, side: FightSide) {
  const other = side === 'player' ? 'opponent' : 'player'
  ready(f, side)
  const initial = f.state[other].health
  f.hit(side, 'standingLight')
  const punchDamage = initial - f.state[other].health
  const tick = Math.max(
    0,
    Math.round(2 * nenDamageFactor(f.state[other], 'torso') * hatsuDefenceFactor(f.state[other])),
  )
  if (punchDamage <= 0 || tick <= 0)
    throw new Error('Basho requires a real punch and finite native burn damage')
  for (let i = 0; f.state[other].health > 40 && f.state.phase === 'fighting' && i < 40; i++) {
    ready(f, side)
    f.hit(side, 'standingHeavy')
  }
  for (
    let i = 0;
    f.state[other].health > punchDamage + tick * 3 && f.state.phase === 'fighting' && i < 20;
    i++
  ) {
    ready(f, side)
    f.hit(side, 'standingLight')
  }
  ready(f, side)
  f.advance(30)
  return { punchDamage, tick }
}
export function createBashoFilm(
  options: { target?: FighterId; side?: FightSide; stageId?: FightStageId } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const target = options.target ?? 'yokotani',
    stageId = options.stageId ?? 'whale-hold',
    loser = side === 'player' ? 'opponent' : 'player'
  f.cut({
    player: side === 'player' ? 'basho' : target,
    opponent: side === 'player' ? target : 'basho',
    stageId,
    gap: 5,
    title: 'BASHO',
    subtitle: 'Le dernier vers',
    tags: [],
    ren: false,
  })
  f.advance()
  const damage = prepare(f, side)
  const health = f.state[loser].health,
    x = f.state[side].x
  f.state = composeBashoPoem({ state: f.state, side, text: BASHO_POEMS.fr }, performAuraAttack)
  f.advance(BASHO_WRITING_FRAMES)
  const written = f.state[side].bashoPoem?.ready === true
  const stationary = f.state[side].x === x,
    harmlessWriting = f.state[loser].health === health
  f.hit(side, 'standingLight')
  const ignited = f.state[loser].bashoBurn?.owner === side,
    aliveOnContact = f.state[loser].health > 0
  let heatDeath = false
  for (let i = 0; f.state.phase === 'fighting' && i < BASHO_FIRE_FRAMES + 30; i++) {
    const before = f.state
    f.advance()
    const burn = before[loser].bashoBurn
    if (before[loser].health > 0 && f.state[loser].health === 0) {
      heatDeath =
        burn?.owner === side &&
        (burn.remainingFrames - 1) % 30 === 0 &&
        f.state[loser].health === Math.max(0, before[loser].health - damage.tick) &&
        f.state.impact?.sequence === before.impact?.sequence
    }
  }
  const burnKnockout = f.state.winner === side && f.state[loser].health === 0 && heatDeath
  if (!written || !stationary || !harmlessWriting || !ignited || !aliveOnContact || !burnKnockout)
    throw new Error(
      `Basho native fire verdict required: ${JSON.stringify({ written, stationary, harmlessWriting, ignited, aliveOnContact, burnKnockout, health: f.state[loser].health })}`,
    )
  return {
    state: f.state,
    report: {
      ...f.report(),
      duration: 10,
      frameCount: 600,
      hero: 'basho',
      target,
      stageId,
      winner: side,
      written,
      stationary,
      harmlessWriting,
      ignited,
      aliveOnContact,
      burnKnockout,
      heatDeath,
      recognizedPoem: recognizedBashoPoem(BASHO_POEMS.fr),
      arbitrarySpell: false,
      ...damage,
      timings: BASHO_TIMING,
      source:
        'One uninterrupted native fight first weakens the target physically, then completes the attested fire poem while stationary. A real fist contact ignites a still-living target; native periodic heat damage earns the knockout. The after-verdict writing, three impacts, flames and charred collapse dramatize that condition without a new poem, automatic literary score, paralysis or global damage boost.',
    },
  }
}
