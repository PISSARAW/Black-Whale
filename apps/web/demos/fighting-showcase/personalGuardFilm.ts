import { ContinuousDirector } from './continuousDirector'
import {
  furykovCounterPlan,
  FURYKOV_COUNTER_HITS,
} from '../../src/lib/fighting/victory/furykovCounterPlan'
import { respondMoonlightContract } from '../../src/lib/fighting/moonlightContract'
import {
  personalGuardTrack,
  type PersonalGuard,
} from '../../src/lib/fighting/victory/personalGuardTrack'
import {
  GUARD_COMBAT_START,
  GUARD_LAST_HIT,
} from '../../src/lib/fighting/victory/personalGuardCombat'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

function longhiProof(f: ContinuousDirector, side: FightSide) {
  const other = side === 'player' ? 'opponent' : 'player'
  const health = [f.state.player.health, f.state.opponent.health]
  f.move(side, 'neutralSpecial')
  const offered = Boolean(f.state.moonlight?.offer)
  const notSignedOnHit = !f.state.moonlight?.active
  f.state = respondMoonlightContract({ state: f.state, side: other, accept: true })
  const freelySigned = Boolean(f.state.moonlight?.active)
  const noContractDamage =
    f.state.player.health === health[0] && f.state.opponent.health === health[1]
  f.move(other, 'standingLight')
  const breached = f.state.moonlight?.outcome?.kind === 'breached'
  const zetsu = f.state[other].moonlightZetsu === true && f.state[other].nen.mode === 'zetsu'
  if (!offered || !notSignedOnHit || !freelySigned || !noContractDamage || !breached || !zetsu)
    throw new Error('Native Moonlight Act proof failed')
  return { offered, notSignedOnHit, freelySigned, noContractDamage, breached, zetsu }
}
function furykovProof(f: ContinuousDirector, side: FightSide) {
  f.hit(side, 'neutralSpecial')
  f.until(() => f.free(side))
  const other = side === 'player' ? 'opponent' : 'player'
  if (!f.state[side].comboMaster) throw new Error('Native Combo Master console required')
  return {
    consoleOpened: true,
    ...furykovCounterPlan(f.state[other].id),
    preparationAssumed: true,
    instantDecipher: false,
    instantFabrication: false,
  }
}
export function createPersonalGuardFilm(options: {
  hero: PersonalGuard
  target?: FighterId
  side?: FightSide
  stageId?: FightStageId
}) {
  const { hero } = options,
    target = options.target ?? 'hisoka'
  const side = options.side ?? 'player',
    loser = side === 'player' ? 'opponent' : 'player'
  const stageId = options.stageId ?? 'whale-hold'
  const f = new ContinuousDirector()
  f.cut({
    player: side === 'player' ? hero : target,
    opponent: side === 'player' ? target : hero,
    stageId,
    gap: 6,
    title: hero.toUpperCase(),
    subtitle: hero === 'longhi' ? 'Moonlight Act' : 'Combo Master',
    tags: [],
    ren: false,
  })
  f.advance()
  let abilityProof: object
  if (hero === 'longhi') abilityProof = longhiProof(f, side)
  else abilityProof = furykovProof(f, side)
  for (let i = 0; f.state.phase === 'fighting' && i < 90; i++) {
    f.until(() => f.free(side) && f.free(loser))
    f.close(side, 4)
    f.hit(side, 'standingHeavy')
  }
  if (f.state.winner !== side || f.state[loser].health !== 0)
    throw new Error('Native guard knockout required')
  const track = personalGuardTrack(hero, target)
  return {
    state: f.state,
    report: {
      ...f.report(),
      duration: 10,
      frameCount: 600,
      hero,
      target,
      stageId,
      winner: side,
      abilityProof,
      separateAlertProbe: false,
      preparationAssumed: hero === 'furykov',
      physicalKnockout: true,
      noNewNenDamage: true,
      impactFrames:
        hero === 'furykov'
          ? [...FURYKOV_COUNTER_HITS]
          : track.impacts.map((hit) =>
              Math.round(
                GUARD_COMBAT_START +
                  (hit.index / track.last) * (GUARD_LAST_HIT - GUARD_COMBAT_START),
              ),
            ),
      source:
        'Native Hatsu conditions and a real physical knockout. Longhi preserves her contract and five native blows. Furykov uses a bespoke counter-weapon, with completed analysis and fabrication explicitly assumed before combat as requested. Its design and counter-effects are cinematic fiction, with no new simulation damage or universal Nen cancellation.',
    },
  }
}
