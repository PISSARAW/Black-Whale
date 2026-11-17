import { ContinuousDirector } from './continuousDirector'
import { CYCLOTRON_ROTATION_FRAMES } from '../../src/lib/fighting/phinksCyclotron'

/** A real six-turn Cyclotron ends the same duel; the export keeps its finishing ten seconds. */
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
  f.advance(70)
  const end = f.states.length - 1
  const sourceAt = (age: number) => {
    if (age < 36) return start
    if (age < 228) return start + Math.floor(((release - start) * (age - 36)) / 192)
    if (age < 270) return release + Math.floor(((impact - release) * (age - 228)) / 42)
    return impact + Math.floor((end - impact) * Math.min(1, (age - 270) / 80))
  }
  const sources = Array.from({ length: 600 }, (_, age) => sourceAt(age))
  const finalImpacts = f.audit.filter(
    (e) => e.kind === 'impact' && Number(e.second) >= release / 60,
  )
  if (finalImpacts.length !== 1)
    throw new Error('Cyclotron must defeat the target with one contact')
  return {
    states: sources.map((i) => f.states[i]),
    report: {
      ...f.report(),
      duration: 10,
      frameCount: 600,
      character: 'Phinks',
      opponent: 'Kurapika',
      nativeTurns: turns,
      nativeStartFrame: start,
      nativeReleaseFrame: release,
      nativeImpactFrame: impact,
      finalPunch: finalImpacts[0],
      winner: f.state.winner,
      source:
        'One production duel: real preparatory damage, six paid right-arm turns, one native Cyclotron K.-O.; cinematic poses, fragmentation and edit are presentation effects.',
      victory: {
        startFrame: 0,
        startSecond: 0,
        duration: 10,
        frameCount: 600,
        rotationsStartFrame: 36,
        rotationsEndFrame: 228,
        impactFrame: 270,
        pulverizationFrame: 282,
        announcementFrame: 420,
      },
    },
  }
}
