import { ContinuousDirector } from './continuousDirector'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

/** The native engine proves the real carried cuff, harmless capture and physical verdict. */
export function createHinrighFatalityFilm(
  options: { target?: FighterId; stageId?: FightStageId; side?: FightSide } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player'
  const loser = side === 'player' ? 'opponent' : 'player'
  const target = options.target ?? 'padaille',
    stageId = options.stageId ?? 'vip-casino'
  f.cut({
    player: side === 'player' ? 'hinrigh' : target,
    opponent: side === 'player' ? target : 'hinrigh',
    stageId,
    gap: 28,
    title: 'HINRIGH — PIÈCE À CONVICTION',
    subtitle: 'Biohazard',
    tags: ['MATÉRIALISATION'],
    ren: false,
  })
  f.advance()
  const inventory = f.state[side].biohazard?.objects.length === 2
  const health = f.state[loser].health
  f.hit(side, 'neutralSpecial')
  f.until(() => Boolean(f.state[loser].biohazardRestraint), 180)
  const capture = f.state[loser].biohazardRestraint?.owner === side
  const harmless = f.state[loser].health === health
  for (let i = 0; f.state.phase === 'fighting' && i < 60; i++) {
    f.until(() => f.free(side) && f.free(loser))
    f.close(side, 4)
    f.hit(side, 'standingHeavy')
  }
  if (!inventory || !capture || !harmless || f.state.winner !== side)
    throw new Error(
      `Native Biohazard capture and physical victory required: ${JSON.stringify({ inventory, capture, harmless, winner: f.state.winner })}`,
    )
  return {
    state: f.state,
    report: {
      ...f.report(),
      duration: 10,
      frameCount: 600,
      character: 'Hinrigh',
      target,
      stageId,
      winner: side,
      inventory,
      capture,
      harmless,
      victory: {
        cameraFrame: 30,
        pigeonFrame: 54,
        snakeFrame: 78,
        wristFrame: 174,
        ankleFrame: 222,
        shotFrame: 360,
        fallFrame: 372,
        catFrame: 474,
        portraitFrame: 486,
      },
      source:
        'One native fight transforms a real carried pair into pigeons, records a harmless physical capture, then earns an ordinary physical knockout. The camera-cat and ordinary pistol-snake are a manga-inspired post-verdict staging, without adding weapons, damage, permanent restraint or a new combat Hatsu to the simulation.',
    },
  }
}
