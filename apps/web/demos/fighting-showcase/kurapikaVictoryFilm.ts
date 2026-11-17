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
  f.held.player = { down: true, aura: true }
  f.chain('opponent', ['lowLight', 'standingHeavy'])
  f.held.player = {}
  f.chain('player', ['lowLight', 'standingHeavy'])
  f.recover('player')
  f.close('player')
  f.hit('player', 'forwardSpecial')
  f.aerial('opponent')
  f.chain('player', ['standingLight', 'backHeavy'])
  f.recover('opponent')
  f.book('backSpecial')
  f.close('opponent')
  f.hit('opponent', 'neutralSpecial')
  for (
    let i = 0;
    i < 14 && f.states.length < 1680 && f.state.opponent.health > 70 && f.state.player.health > 90;
    i++
  ) {
    f.chain('player', i % 2 ? ['standingLight', 'standingHeavy'] : ['lowLight', 'standingHeavy'])
    if (i % 3 === 1) f.aerial('opponent')
    else f.chain('opponent', ['standingLight', 'backHeavy'])
  }
  f.held = { player: {}, opponent: {} }
  for (let i = 0; f.state.opponent.health > 18 && i < 40; i++) {
    f.until(() => f.free('player') && f.free('opponent'))
    f.close('player')
    f.hit('player', f.state.opponent.health > 45 ? 'standingHeavy' : 'standingLight')
  }
  f.recover('player')
  f.close('player', 7)
  const start = f.states.length
  f.state = toggleEmperorTime(f.state, 'player')
  f.advance(12)
  f.hit('player', 'neutralSpecial')
  f.until(() => Boolean(f.state.opponent.chainJail))
  const capture = f.states.findIndex((s, i) => i >= start && Boolean(s.opponent.chainJail))
  if (capture < start || f.state.opponent.nen.mode !== 'zetsu')
    throw new Error('Chain Jail must bind Chrollo and force Zetsu')
  f.advance(18)
  f.close('player', 4.5)
  f.hit('player', 'standingHeavy')
  f.until(() => f.state.phase === 'finished')
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
