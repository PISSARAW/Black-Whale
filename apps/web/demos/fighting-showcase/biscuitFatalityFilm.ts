import { ContinuousDirector } from './continuousDirector'
import { BISCUIT_LANDING } from '../../src/lib/fighting/victory/biscuitFall'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

/** A native physical knockout in the natural body precedes the cosmetic victory. */
export function createBiscuitFatalityFilm(
  options: { target?: FighterId; stageId?: FightStageId; side?: FightSide } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const target = options.target ?? 'hisoka',
    loser = side === 'player' ? 'opponent' : 'player'
  const stageId = options.stageId ?? 'heavens-arena'
  f.cut({
    player: side === 'player' ? 'biscuit' : target,
    opponent: side === 'player' ? target : 'biscuit',
    stageId,
    gap: 4,
    title: 'BISCUIT — LE SOIN DE GRÂCE',
    subtitle: 'Magical Esthetician',
    tags: ['VÉRITABLE APPARENCE'],
    ren: false,
  })
  f.advance()
  const before = {
    health: f.state[side].health,
    aura: f.state[side].aura,
    target: f.state[loser].health,
  }
  f.hit(side, 'neutralSpecial')
  const revealed = f.state[side].biscuitTrueForm === true
  const harmlessReveal =
    before.health === f.state[side].health &&
    before.aura === f.state[side].aura &&
    before.target === f.state[loser].health
  for (let i = 0; f.state.phase === 'fighting' && i < 65; i++) {
    f.until(() => f.free(side) && f.free(loser))
    f.close(side, 3.3)
    f.hit(side, 'standingHeavy')
  }
  if (!revealed || !harmlessReveal || f.state.winner !== side || f.state[loser].health !== 0)
    throw new Error(
      `Biscuit requires a harmless native reveal and physical knockout: ${JSON.stringify({ revealed, harmlessReveal, winner: f.state.winner, health: f.state[loser].health })}`,
    )
  return {
    state: f.state,
    report: {
      ...f.report(),
      frameCount: 600,
      duration: 10,
      character: 'Biscuit',
      target,
      stageId,
      winner: side,
      revealed,
      harmlessReveal,
      source:
        'Native transformation restores Biscuit’s physical strength without damage, healing or aura cost, followed by a real martial knockout. Cookie’s hand treatment, the body change, one punch and manicure are post-verdict presentation only; no offensive lotion or new ability is added to the simulation.',
      victory: {
        treatmentFrame: 0,
        revealFrame: 210,
        impactFrame: 330,
        landingFrame: BISCUIT_LANDING,
        returnFrame: 420,
        announcementFrame: 480,
      },
    },
  }
}
