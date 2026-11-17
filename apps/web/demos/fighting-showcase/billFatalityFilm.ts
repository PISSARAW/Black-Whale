import { canStartFighterAttack } from '../../src/lib/fighting/fighterAttacks'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import { combatRoute } from '../../src/lib/fighting/combatRoutes'
import { BILL_COMBO_ROUTES, billComboTrack } from '../../src/lib/fighting/victory/billComboTrack'
import { ContinuousDirector } from './continuousDirector'
import { createFightEnvironment } from '../../src/lib/fighting/fightEnvironment'
import { createBattlefield } from '../../src/lib/fighting/preparationWorld'
import { hatsuDamageFactor } from '../../src/lib/fighting/hatsu'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

/** A real prepared living seed grows harmlessly; ordinary physical strikes earn the knockout. */
export function createBillFatalityFilm(
  options: { target?: FighterId; stageId?: FightStageId; side?: FightSide } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const loser = side === 'player' ? 'opponent' : 'player'
  const target = options.target ?? 'benjamin',
    stageId = options.stageId ?? 'banquet-hall'
  f.cut({
    player: side === 'player' ? 'bill' : target,
    opponent: side === 'player' ? target : 'bill',
    stageId,
    gap: 50,
    title: 'BILL — DERNIER REMPART',
    subtitle: 'Erigeron',
    tags: ['GRAINE VIVANTE'],
    ren: false,
  })
  const environment = createFightEnvironment({
    stageId,
    preparation: { mode: 'scenario', resources: ['plants'], cohorts: [] },
  })
  f.state = { ...f.state, environment, battlefield: createBattlefield(environment) }
  f.advance()
  const seedId = `${side}:seed`
  const realSeed = f.state.battlefield!.entities.some(
    (seed) =>
      seed.id === seedId && seed.kind === 'seed' && seed.material === 'real' && !seed.growth,
  )
  const before = { health: f.state[side].health, target: f.state[loser].health }
  f.hit(side, 'neutralSpecial')
  const grew = f.state.battlefield!.entities.find((seed) => seed.id === seedId)?.growth === 1
  const harmlessGrowth =
    f.state[side].health === before.health &&
    f.state[loser].health === before.target &&
    hatsuDamageFactor(f.state[side]) === 1 &&
    !f.state[side].attack
  for (let i = 0; f.state.phase === 'fighting' && i < 30; i++) {
    f.until(() => f.free(side) && f.free(loser))
    f.close(side, 6)
    const route = combatRoute(BILL_COMBO_ROUTES[i % BILL_COMBO_ROUTES.length])
    for (const slot of route.moves) {
      if (f.state.phase !== 'fighting') break
      const move = moveForSlot('bill', slot)!
      f.until(() => !f.state.hitstop && canStartFighterAttack(f.state[side], move.kind, move.id))
      f.execute(side, slot)
    }
  }
  const physicalKnockout = f.states.some(
    (state, i) =>
      i > 0 &&
      state[loser].health === 0 &&
      f.states[i - 1][loser].health > 0 &&
      Boolean(f.states[i - 1][side].attack?.moveId?.startsWith('bill:')),
  )
  if (!realSeed || !grew || !harmlessGrowth || !physicalKnockout || f.state.winner !== side)
    throw new Error(
      `Bill requires harmless native seed growth and a physical knockout: ${JSON.stringify({ realSeed, grew, harmlessGrowth, physicalKnockout, winner: f.state.winner, health: f.state[loser].health })}`,
    )
  const track = billComboTrack(target)
  const nativeHits = track.impacts.map((hit) => ({
    ...hit,
    age: Math.round((hit.index * 342) / track.last),
  }))
  return {
    state: f.state,
    report: {
      ...f.report(),
      frameCount: 600,
      duration: 10,
      character: 'Bill',
      target,
      stageId,
      winner: side,
      realSeed,
      grew,
      harmlessGrowth,
      physicalKnockout,
      nativeCombos: BILL_COMBO_ROUTES.map((id) => ({ id, moves: combatRoute(id).moves })),
      nativeHits,
      nativeFrames: track.last,
      victory: {
        hitFrames: nativeHits.map((hit) => hit.age),
        impactFrame: 342,
        fallFrame: 343,
        growthFrame: 456,
        bloomFrame: 480,
        fullBloomFrame: 510,
        portraitFrame: 510,
      },
      source:
        'One continuous scenario supplies a real living seed. Native Erigeron germinates it without damage, healing or a personal combat bonus; physical guard blows then earn the real knockout. The ten-second post-verdict edit places three verified production combos (3, 4 and 5 hits), sampled with the production body plans, cancels, recovery links, hitstop and reactions before the harmless growth signature. No attacking plant, accelerated aging, restraint or new combat move is introduced.',
    },
  }
}
