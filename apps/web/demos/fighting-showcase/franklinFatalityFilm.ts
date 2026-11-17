import { ContinuousDirector } from './continuousDirector'

/** Real travelling Nen bullets decide the duel. The ten-second edit only changes presentation. */
export function createFranklinFatalityFilm() {
  const f = new ContinuousDirector()
  f.cut({
    player: 'franklin',
    opponent: 'kurapika',
    stageId: 'heavens-arena',
    gap: 6,
    title: 'FRANKLIN × KURAPIKA',
    subtitle: 'Le silence après la rafale.',
    tags: ['DOUBLE MACHINE GUN'],
    ren: false,
  })
  f.advance()
  for (let i = 0; f.state.opponent.health > 85 && i < 35; i++) {
    f.until(() => f.free('player') && f.free('opponent'))
    f.close('player')
    f.hit('player', 'standingLight')
  }
  f.until(() => f.free('player') && f.free('opponent'))
  f.held.player = { down: true, aura: true }
  f.until(() => f.state.player.aura >= 99.9, 600)
  f.held.player = f.direction('player', true)
  f.until(() => Math.abs(f.state.player.x - f.state.opponent.x) >= 23, 180)
  f.held.player = {}
  f.advance()
  const start = f.states.length,
    firstId = f.state.nextProjectileId
  f.move('player', 'finisher')
  f.until(() => f.state.phase === 'finished', 300)
  const death = f.states.findIndex((s, i) => i >= start && s.phase === 'finished')
  if (f.state.winner !== 'player' || death < start)
    throw new Error(
      JSON.stringify({
        health: f.state.opponent.health,
        aura: f.state.player.aura,
        audit: f.audit.slice(-5),
      }),
    )
  const nativeImpacts = f.audit.filter((e) => e.kind === 'impact' && Number(e.second) >= start / 60)
  const firstShot = f.states.findIndex((s, i) => i >= start && s.nextProjectileId > firstId)
  const shots: Array<{ id: number; nativeFrame: number; emission: number; impact: number | null }> =
    []
  const ageAt = (frame: number) => 156 + ((frame - firstShot) / (death - firstShot)) * 194
  for (let frame = start; frame <= death; frame++) {
    const previous = frame === start ? firstId : f.states[frame - 1].nextProjectileId
    for (let id = previous; id < f.states[frame].nextProjectileId; id++) {
      const impact = nativeImpacts.find((e) => Number(e.projectileId) === id)
      shots.push({
        id,
        nativeFrame: frame,
        emission: ageAt(frame),
        impact: impact ? ageAt(Math.round(Number(impact.second) * 60)) : null,
      })
    }
  }
  if (
    shots.length < 20 ||
    nativeImpacts.length < 15 ||
    nativeImpacts.some((e) => e.projectileId == null)
  )
    throw new Error('The finishing barrage must use many actual travelling Nen bullets')
  f.advance(70)
  const end = f.states.length - 1
  const sourceAt = (age: number) => {
    if (age < 156) return start + Math.floor(((firstShot - start) * age) / 156)
    if (age < 350) return firstShot + Math.floor(((death - firstShot) * (age - 156)) / 194)
    return death + Math.floor((end - death) * Math.min(1, (age - 350) / 70))
  }
  return {
    shots,
    states: Array.from({ length: 600 }, (_, age) => f.states[sourceAt(age)]),
    report: {
      ...f.report(),
      duration: 10,
      frameCount: 600,
      character: 'Franklin',
      opponent: 'Kurapika',
      winner: f.state.winner,
      nativeStartFrame: start,
      nativeFirstShotFrame: firstShot,
      nativeDeathFrame: death,
      nativeShotCount: shots.length,
      nativeBulletImpacts: nativeImpacts.length,
      shots,
      nativeImpacts,
      source:
        'One production duel: real preparatory damage, aura recovery and an extended Double Machine Gun barrage. Travelling Nen bullets cause the K.-O.; cinematography, impacts, wounds and smoke are presentation effects.',
      victory: {
        startFrame: 0,
        startSecond: 0,
        duration: 10,
        frameCount: 600,
        openingFrame: 0,
        firstShotFrame: 156,
        deathFrame: 350,
        fallFrame: 385,
        announcementFrame: 420,
      },
    },
  }
}
