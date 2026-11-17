import { ContinuousDirector } from './continuousDirector'
import type { FighterId, FightSide } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'

/** Native Texture Surprise, Ren and Gyo precede a real verdict; fear is post-verdict staging. */
export function createHisokaFearFilm(
  options: { target?: FighterId; side?: FightSide; stageId?: FightStageId } = {},
) {
  const f = new ContinuousDirector(),
    side = options.side ?? 'player',
    loser = side === 'player' ? 'opponent' : 'player'
  const target = options.target ?? 'benjamin',
    stageId = options.stageId ?? 'whale-hold'
  f.cut({
    player: side === 'player' ? 'hisoka' : target,
    opponent: side === 'player' ? target : 'hisoka',
    stageId,
    gap: 9,
    title: 'HISOKA — REGARDE-MOI',
    subtitle: 'Ren · Gyo · Texture Surprise',
    tags: ['MORT DE PEUR'],
    ren: false,
  })
  f.advance()
  f.hit(side, 'downSpecial')
  f.until(() => f.free(side))
  const texturePrepared = Boolean(f.state[side].textureSurprise)
  const health = [f.state[side].health, f.state[loser].health]
  f.held[side] = { aura: true }
  f.advance(30)
  const renActive = f.state[side].nen.mode === 'ren'
  f.held[loser] = { gyo: true }
  f.advance(30)
  const gyoActive = Boolean(f.state[loser].nen.gyo)
  const textureNotDispelled = Boolean(f.state[side].textureSurprise)
  const noPressureDamage = f.state[side].health === health[0] && f.state[loser].health === health[1]
  f.held = { player: {}, opponent: {} }
  f.advance()
  for (let i = 0; f.state.phase === 'fighting' && i < 60; i++) {
    f.until(() => f.free(side) && f.free(loser))
    f.close(side, 4.5)
    f.hit(side, 'standingHeavy')
  }
  if (
    !texturePrepared ||
    !renActive ||
    !gyoActive ||
    !textureNotDispelled ||
    !noPressureDamage ||
    f.state.winner !== side
  )
    throw new Error(
      `Hisoka fear prerequisites failed: ${JSON.stringify({ texturePrepared, renActive, gyoActive, textureNotDispelled, noPressureDamage, winner: f.state.winner })}`,
    )
  return {
    state: f.state,
    report: {
      ...f.report(),
      duration: 10,
      frameCount: 600,
      character: 'Hisoka',
      target,
      stageId,
      winner: side,
      texturePrepared,
      renActive,
      gyoActive,
      textureNotDispelled,
      noPressureDamage,
      narrativeFearDeath: true,
      victory: {
        renFrame: 0,
        gyoFrame: 120,
        revealFrame: 180,
        expressionFrame: 240,
        terrorFrame: 228,
        deathFrame: 390,
        portraitFrame: 504,
      },
      source:
        'Native commands prepare Texture Surprise on cloth, raise Ren and focus the observer’s Gyo without damage or dispelling the cloth. Existing physical attacks earn the immutable verdict. The ten-second post-verdict horror scene interprets the observer’s Gyo as a subjective revelation of Hisoka’s unmasked face, followed by the requested narrative death of fright. It adds no Ren damage, death trigger or Gyo dispel to combat rules.',
    },
  }
}
