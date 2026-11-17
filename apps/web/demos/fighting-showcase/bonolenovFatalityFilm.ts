import { ContinuousDirector } from './continuousDirector'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

/** The demo earns its verdict with a complete native dance and homing Jupiter. */
export function createBonolenovFatalityFilm(
  options: { target?: FighterId; stageId?: FightStageId; side?: FightSide } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const target = options.target ?? 'franklin',
    loser = side === 'player' ? 'opponent' : 'player'
  const stageId = options.stageId ?? 'heavens-arena'
  f.cut({
    player: side === 'player' ? 'bonolenov' : target,
    opponent: side === 'player' ? target : 'bonolenov',
    stageId,
    gap: 4,
    title: 'BONOLENOV — LE DERNIER MOUVEMENT',
    subtitle: 'Battle Cantabile',
    tags: ['PROLOGUE', 'JUPITER'],
    ren: false,
  })
  f.advance()
  for (let i = 0; f.state[loser].health > 48 && i < 65; i++) {
    f.until(() => f.free(side) && f.free(loser))
    f.close(side, 4)
    f.hit(side, 'standingHeavy')
  }
  function recharge() {
    f.ready(side)
    f.held[side] = { down: true, aura: true }
    f.until(() => f.state[side].aura >= 99, 600)
    f.held[side] = {}
    f.advance()
  }
  recharge()
  f.hit(side, 'neutralSpecial')
  f.advance(60)
  const prologue = f.state[side].battleCantabile?.prologue === true
  f.close(side, 4)
  f.hit(side, 'forwardSpecial')
  const spear = f.states.some(
    (state) =>
      state[side].attack?.moveId === 'bonolenov:forwardSpecial' && state[side].attack?.confirmedHit,
  )
  recharge()
  f.retreat(side, 60)
  const start = f.state.frame
  const jupiterId = f.state.nextProjectileId
  f.hit(side, 'finisher')
  const completeDance = f.state[side].battleCantabile?.preparation?.piece === 'jupiter'
  f.advance(90)
  const prepared = f.states.filter(
    (state) => state.frame > start && state[side].battleCantabile?.preparation?.piece === 'jupiter',
  ).length
  f.held[loser] = { ...f.direction(loser, true), jump: true }
  f.advance(24)
  f.held[loser] = {}
  f.until(() => f.state.phase === 'finished', 180)
  const jupiterDeath = f.states.some(
    (state, i) =>
      i > 0 &&
      f.states[i - 1][loser].health > 0 &&
      state[loser].health === 0 &&
      state.impact?.projectileId === jupiterId &&
      state.nextProjectileId > jupiterId,
  )
  if (!prologue || !spear || prepared < 89 || !jupiterDeath || f.state.winner !== side)
    throw new Error(
      `Bonolenov requires native Prologue, spear and Jupiter: ${JSON.stringify({ prologue, spear, prepared, jupiterDeath, health: f.state[loser].health, winner: f.state.winner })}`,
    )
  return {
    state: f.state,
    report: {
      ...f.report(),
      frameCount: 600,
      duration: 10,
      character: 'Bonolenov',
      target,
      stageId,
      winner: side,
      prologue,
      spear,
      prepared,
      completeDance,
      jupiterDeath,
      source:
        'A continuous native fight completes Prologue, lands the conjured spear, completes the 90-frame Jupiter dance and earns a knockout with the actual homing projectile. The ten-second presentation changes no health, knowledge or stage state.',
      victory: {
        armorFrame: 72,
        tapFrames: [132, 168],
        formationFrame: 210,
        chaseFrame: 288,
        impactFrame: 396,
        bowFrame: 516,
      },
    },
  }
}
