import { ContinuousDirector } from './continuousDirector'
import { CYCLOTRON_ROTATION_FRAMES } from '../../src/lib/fighting/phinksCyclotron'
import {
  PHINKS_CONTACT,
  PHINKS_DEBRIS_HIT,
  PHINKS_PARRY,
  PHINKS_PLANT,
  PHINKS_FLOOR_CRACK,
  PHINKS_DEBRIS_SETTLE,
  PHINKS_DISINTEGRATED,
  PHINKS_FRACTURE,
  PHINKS_FRAGMENT_BURST,
  PHINKS_VERDICT,
  PHINKS_VICTORY_DURATION,
  PHINKS_VICTORY_FRAMES,
  PHINKS_WIDE_SHOT,
  PHINKS_WINDUP_END,
} from '../../src/lib/fighting/victory/phinksTiming'

/** A real six-turn Cyclotron ends the same duel; the production renderer stages its decisive contact. */
export function createPhinksFatalityFilm() {
  const f = new ContinuousDirector()
  f.cut({
    player: 'phinks',
    opponent: 'kurapika',
    stageId: 'heavens-arena',
    gap: 5,
    title: 'PHINKS × KURAPIKA',
    subtitle: 'Un seul coup suffit.',
    tags: ['RIPPER CYCLOTRON'],
    ren: false,
  })
  f.advance()
  for (let i = 0; f.state.opponent.health > 24 && i < 35; i++) {
    f.until(() => f.free('player') && f.free('opponent'))
    f.close('player')
    f.hit('player', 'standingLight')
  }
  f.until(() => f.free('player') && f.free('opponent'))
  f.held.player = { down: true, aura: true }
  f.until(() => f.state.player.aura >= 99.9, 600)
  f.held.player = {}
  f.advance()
  f.close('player', 5)
  const start = f.states.length
  f.move('player', 'neutralSpecial')
  f.advance(CYCLOTRON_ROTATION_FRAMES * 6)
  const turns = f.state.player.hatsuEffects.cyclotronTurns
  const release = f.states.length
  f.move('player', 'finisher')
  f.until(() => f.state.phase === 'finished', 100)
  const impact = f.states.findIndex((s, i) => i >= release && s.phase === 'finished')
  if (turns !== 6 || f.state.winner !== 'player' || impact < release)
    throw new Error(
      JSON.stringify({ turns, health: f.state.opponent.health, audit: f.audit.slice(-5) }),
    )
  const finalImpacts = f.audit.filter(
    (e) => e.kind === 'impact' && Number(e.second) >= release / 60,
  )
  if (finalImpacts.length !== 1)
    throw new Error('Cyclotron must defeat the target with one contact')
  return {
    state: f.state,
    report: {
      ...f.report(),
      duration: PHINKS_VICTORY_DURATION,
      frameCount: PHINKS_VICTORY_FRAMES,
      character: 'Phinks',
      opponent: 'Kurapika',
      nativeTurns: turns,
      nativeStartFrame: start,
      nativeReleaseFrame: release,
      nativeImpactFrame: impact,
      finalPunch: finalImpacts[0],
      winner: f.state.winner,
      source:
        'One production duel: real preparatory damage, six paid right-arm turns, one native Cyclotron K.-O.; the production victory shows the final two turns.',
      victory: {
        startFrame: 0,
        startSecond: 0,
        duration: PHINKS_VICTORY_DURATION,
        frameCount: PHINKS_VICTORY_FRAMES,
        rotationsStartFrame: 0,
        rotationsEndFrame: PHINKS_WINDUP_END,
        parryFrame: PHINKS_PARRY,
        stepPlantFrame: PHINKS_PLANT,
        impactFrame: PHINKS_CONTACT,
        floorCrackFrame: PHINKS_FLOOR_CRACK,
        wideShotFrame: PHINKS_WIDE_SHOT,
        fractureFrame: PHINKS_FRACTURE,
        fragmentBurstFrame: PHINKS_FRAGMENT_BURST,
        disintegratedFrame: PHINKS_DISINTEGRATED,
        debrisHitFrame: PHINKS_DEBRIS_HIT,
        debrisSettleFrame: PHINKS_DEBRIS_SETTLE,
        verdictFrame: PHINKS_VERDICT,
      },
    },
  }
}
