import { createCinematicTrack } from './cinematicCamera'
import { FeitanFatalityDirector } from './feitanFatalityDirector'

export function createFeitanFatalityFilm() {
  const f = new FeitanFatalityDirector()
  f.cut({
    player: 'feitan',
    opponent: 'hisoka',
    stageId: 'heavens-arena',
    gap: 16,
    title: 'FEITAN × HISOKA',
    subtitle: 'Le soleil du supplice',
    tags: ['PAIN PACKER', 'RISING SUN'],
    ren: true,
  })
  for (const side of ['player', 'opponent'] as const)
    f.state[side] = { ...f.state[side], health: 400, maxHealth: 400 }
  f.advance(20)
  for (let i = 0; i < 9 && f.state.opponent.health > 150; i++) {
    f.chain('player', i % 2 ? ['lowLight', 'standingHeavy'] : ['standingLight', 'standingHeavy'])
    if (f.state.player.health > 160) f.chain('opponent', ['standingLight', 'backHeavy'])
    if (i === 2) f.aerial('player')
  }
  for (let i = 0; i < 30 && f.state.opponent.health > 95; i++) {
    f.close('player')
    f.hit('player', 'standingLight')
  }
  f.recover()
  f.close('player', 7)
  f.ready('player')
  const start = f.states.length
  f.hit('player', 'neutralSpecial')
  const equipped = f.states.findIndex(
    (s, i) => i >= start && s.player.hatsuEffects.painPacker?.armour,
  )
  f.ready('player')
  f.advance(12)
  f.hit('player', 'finisher')
  const ignited = f.states.findIndex((s, i) => i >= start && s.player.hatsuEffects.painPacker?.sun)
  f.until(() => f.state.phase === 'finished', 400)
  const death = f.states.findIndex((s, i) => i >= start && s.phase === 'finished')
  if (f.state.winner !== 'player' || equipped < start || ignited <= equipped || death <= ignited)
    throw new Error(
      JSON.stringify({
        equipped,
        ignited,
        death,
        health: f.state.opponent.health,
        aura: f.state.player.aura,
        pain: f.state.player.hatsuEffects.painPacker,
        audit: f.audit.slice(-8),
      }),
    )
  f.advance(60)
  const end = f.states.length - 1
  const sourceAt = (age: number) => {
    if (age < 90) return start + Math.floor(((equipped - start) * age) / 90)
    if (age < 210) return equipped + Math.floor(((ignited - equipped) * (age - 90)) / 120)
    if (age < 360) return ignited + Math.floor(((death - ignited) * (age - 210)) / 150)
    return death + Math.floor((end - death) * Math.min(1, (age - 360) / 60))
  }
  const sources = Array.from({ length: start + 600 }, (_, i) =>
    i < start ? i : sourceAt(i - start),
  )
  return {
    film: f,
    start,
    sources,
    states: sources.map((i) => f.states[i]),
    camera: createCinematicTrack(f.states),
    report: {
      ...f.report(),
      winner: f.state.winner,
      duration: sources.length / 60,
      frameCount: sources.length,
      maximumPain: Math.max(
        ...f.states.map((s) => s.player.hatsuEffects.painPacker?.injuries ?? 0),
      ),
      nativeEquippedFrame: equipped,
      nativeIgnitionFrame: ignited,
      nativeDeathFrame: death,
      victory: {
        startFrame: start,
        startSecond: start / 60,
        duration: 10,
        frameCount: 600,
        armourFrame: start + 90,
        ignitionFrame: start + 210,
        deathFrame: start + 360,
        announcementFrame: start + 420,
      },
    },
  }
}
