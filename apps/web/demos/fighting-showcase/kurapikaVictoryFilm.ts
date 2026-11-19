import { toggleEmperorTime } from '../../src/lib/fighting/kurapikaActions'
import { createCinematicTrack } from './cinematicCamera'
import { KurapikaVictoryDirector } from './kurapikaVictoryDirector'

export function createKurapikaVictoryFilm() {
  const f = new KurapikaVictoryDirector()
  f.cut({
    player: 'kurapika',
    opponent: 'chrollo',
    stageId: 'heavens-arena',
    title: 'KURAPIKA × CHROLLO',
    subtitle: 'Le jugement écarlate',
    tags: ['CHAÎNES', 'BRIGADE'],
    gap: 17,
    ren: true,
  })
  for (const side of ['player', 'opponent'] as const)
    f.state[side] = { ...f.state[side], health: 400, maxHealth: 400 }
  f.held = { player: { aura: true, right: true }, opponent: { aura: true, left: true } }
  f.advance(14)
  f.held = { player: {}, opponent: {} }
  f.chain('player', ['standingLight', 'standingHeavy'])
  f.chain('opponent', ['standingLight', 'backHeavy'])
  f.close('opponent')
  f.hit('opponent', 'neutralSpecial')
  // Capture during a live round, before the physical sequence that earns the knockout.
  f.recover('player')
  f.close('player', 5)
  const start = f.states.length
  if (!f.state.player.kurapika?.emperorTime) f.state = toggleEmperorTime(f.state, 'player')
  f.advance(12)
  f.hit('player', 'neutralSpecial')
  f.until(() => Boolean(f.state.opponent.chainJail))
  const capture = f.states.findIndex((s, i) => i >= start && Boolean(s.opponent.chainJail))
  if (capture < start || f.state.opponent.nen.mode !== 'zetsu')
    throw new Error(
      `Chain Jail must bind Chrollo and force Zetsu: ${JSON.stringify({ phase: f.state.phase, health: [f.state.player.health, f.state.opponent.health], aura: f.state.player.aura, nen: f.state.player.nen.mode, emperor: f.state.player.kurapika?.emperorTime, last: f.audit.slice(-5) })}`,
    )
  f.advance(18)
  for (let hit = 0; f.state.phase === 'fighting' && hit < 65; hit++) {
    f.until(() => f.free('player') && f.free('opponent'))
    f.close('player', 4)
    f.hit('player', 'standingHeavy')
  }
  if (f.state.winner !== 'player')
    throw new Error(
      JSON.stringify({
        phase: f.state.phase,
        health: f.state.opponent.health,
        aura: f.state.player.aura,
        last: f.audit.slice(-6),
      }),
    )
  const impact = f.states.findIndex((s, i) => i >= capture && s.phase === 'finished')
  f.advance(70)
  const end = f.states.length - 1
  const sourceAt = (age: number) =>
    age < 90
      ? start + Math.floor(((capture - start) * age) / 90)
      : age < 180
        ? capture + Math.floor(((impact - capture) * (age - 90)) / 90)
        : age < 270
          ? impact + Math.floor(((end - impact) * (age - 180)) / 90)
          : end
  const sources = Array.from({ length: start + 600 }, (_, i) =>
    i < start ? i : sourceAt(i - start),
  )
  const states = sources.map((source) => f.states[source])
  return {
    film: f,
    states,
    sources,
    start,
    camera: createCinematicTrack(f.states),
    report: {
      ...f.report(),
      duration: states.length / 60,
      frameCount: states.length,
      winner: f.state.winner,
      emperorTimeAtVictory: Boolean(f.state.player.kurapika?.emperorTime),
      chainJailTarget: 'chrollo',
      nativeCaptureFrame: capture,
      nativeImpactFrame: impact,
      victory: {
        startFrame: start,
        startSecond: start / 60,
        frameCount: 600,
        duration: 10,
        captureFrame: start + 90,
        captureSecond: (start + 90) / 60,
        impactFrame: start + 180,
        impactSecond: (start + 180) / 60,
        eyesFrame: start + 360,
        eyesSeconds: 4,
        end,
      },
    },
  }
}
