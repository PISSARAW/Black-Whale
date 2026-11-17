import { ContinuousDirector } from './continuousDirector'
import { exposedBlinkyWounds } from '../../src/lib/fighting/blinky'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

/** The living target falls to native blood suction before any cosmetic corpse cleanup. */
export function createShizukuFatalityFilm(
  options: { target?: FighterId; stageId?: FightStageId; side?: FightSide } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const target = options.target ?? 'franklin',
    loser = side === 'player' ? 'opponent' : 'player'
  const stageId = options.stageId ?? 'heavens-arena'
  f.cut({
    player: side === 'player' ? 'shizuku' : target,
    opponent: side === 'player' ? target : 'shizuku',
    stageId,
    gap: 4,
    title: 'SHIZUKU — RIEN À SIGNALER',
    subtitle: 'Deme-chan',
    tags: ['BLINKY'],
    ren: false,
  })
  f.advance()
  for (let i = 0; f.state[loser].health > 45 && i < 65; i++) {
    f.until(() => f.free(side) && f.free(loser))
    f.close(side, 4)
    f.hit(side, 'forwardSpecial')
    if (f.state[side].aura < 45) {
      f.held[side] = { down: true, aura: true }
      f.until(() => f.state[side].aura >= 99, 600)
      f.held[side] = {}
      f.advance()
    }
  }
  f.until(() => f.free(side) && f.free(loser))
  const wounds = exposedBlinkyWounds(f.state[loser])
  for (let i = 0; f.state.phase === 'fighting' && i < 6; i++) {
    f.ready(side)
    if (f.state[side].aura < 45) {
      f.held[side] = { down: true, aura: true }
      f.until(() => f.state[side].aura >= 99, 600)
      f.held[side] = {}
      f.advance()
    }
    f.hit(side, 'finisher')
    f.advance(100)
  }
  const bloodDeath = f.states.some(
    (state, i) =>
      i > 0 &&
      f.states[i - 1][loser].health > 0 &&
      state[loser].health === 0 &&
      state[side].attack?.moveId === 'shizuku:finisher' &&
      state[side].blinky?.lastWasBlood === true,
  )
  if (!wounds || !bloodDeath || f.state.winner !== side || f.state[loser].health !== 0)
    throw new Error(
      `Shizuku requires native wounds and blood-suction knockout: ${JSON.stringify({ wounds, bloodDeath, winner: f.state.winner, health: f.state[loser].health, aura: f.state[side].aura })}`,
    )
  return {
    state: f.state,
    report: {
      ...f.report(),
      frameCount: 600,
      duration: 10,
      character: 'Shizuku',
      target,
      stageId,
      winner: side,
      wounds,
      bloodDeath,
      source:
        'Native Deme-chan blows create exposed wounds; the actual blood-suction command resolves the knockout. A cosmetic edit then portrays the blow, blood extraction, collapse, corpse cleanup and last-object return without changing health or vacuum memory.',
      victory: {
        impactFrame: 84,
        bloodFrame: 138,
        deathFrame: 282,
        cleanupFrame: 342,
        consumedFrame: 402,
        lastObjectFrame: 444,
        returnFrame: 474,
        caughtFrame: 498,
      },
    },
  }
}
