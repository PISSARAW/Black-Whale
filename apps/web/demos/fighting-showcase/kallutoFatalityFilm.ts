import { ContinuousDirector } from './continuousDirector'
import { hasPlantedPaper, selectPaperTarget } from '../../src/lib/fighting/kallutoPaper'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

/** A real hidden planting and guided paper stream must precede the cosmetic finishing scene. */
export function createKallutoFatalityFilm(
  options: { target?: FighterId; stageId?: FightStageId; side?: FightSide } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const target = options.target ?? 'franklin',
    loser = side === 'player' ? 'opponent' : 'player'
  const stageId = options.stageId ?? 'vip-casino'
  f.cut({
    player: side === 'player' ? 'kalluto' : target,
    opponent: side === 'player' ? target : 'kalluto',
    stageId,
    gap: 4,
    title: 'KALLUTO — LA DERNIÈRE DANSE DU PAPIER',
    subtitle: 'Dance of the Serpent’s Bite',
    tags: ['PAPER TEMPEST'],
    ren: false,
  })
  f.advance()
  for (let i = 0; f.state[loser].health > 65 && i < 65; i++) {
    f.until(() => f.free(side) && f.free(loser))
    f.close(side, 4)
    f.hit(side, 'standingHeavy')
  }
  f.until(() => f.free(side) && f.free(loser))
  f.state = selectPaperTarget(f.state, side, 'torso')
  f.held[side] = { conceal: true }
  f.advance(2)
  f.close(side, 12)
  f.hit(side, 'neutralSpecial')
  f.advance(50)
  const planted = hasPlantedPaper(f.state, side, 'torso')
  const concealedPlant = f.states.some(
    (state) =>
      state.projectiles.some(
        (p) => p.owner === side && p.kallutoPaper === 'plant' && p.concealed,
      ) ||
      (state.impact?.attacker === side &&
        state.impact.concealed &&
        hasPlantedPaper(state, side, 'torso')),
  )
  f.held[side] = {}
  for (let i = 0; f.state.phase === 'fighting' && i < 10; i++) {
    f.until(() => f.free(side) && f.free(loser))
    if (f.state[side].aura < 35) {
      f.held[side] = { down: true, aura: true }
      f.until(() => f.state[side].aura >= 99, 600)
      f.held[side] = {}
      f.advance()
    }
    f.hit(side, 'forwardSpecial')
    f.advance(65)
  }
  if (
    !planted ||
    !concealedPlant ||
    f.state.winner !== side ||
    f.state.impact?.projectileId == null
  )
    throw new Error(
      `Kalluto requires a real concealed plant and guided-paper knockout: ${JSON.stringify({ planted, concealedPlant, winner: f.state.winner, health: f.state[loser].health, aura: f.state[side].aura })}`,
    )
  return {
    state: f.state,
    report: {
      ...f.report(),
      frameCount: 600,
      duration: 10,
      character: 'Kalluto',
      target,
      stageId,
      winner: side,
      planted,
      concealedPlant,
      nativeFinishingProjectile: f.state.impact.projectileId,
      source:
        'A concealed physical fragment plants through the engine, followed by a native guided-paper knockout. The cosmetic finishing sequence magnifies the paper volume without altering the combat state.',
      victory: {
        attachmentFrame: 84,
        laughFrame: 108,
        revealFrame: 162,
        stormFrame: 282,
        shredFrame: 318,
        endFrame: 450,
        paperCount: 12288,
      },
    },
  }
}
