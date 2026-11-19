import { createContinuousShowcase } from './continuousChoreography'
import { createCinematicTrack } from './cinematicCamera'

/** Reuse the uninterrupted duel, then execute its final strike from a stretched tether. */
export function createHisokaVictoryFilm() {
  const film = createContinuousShowcase()
  const command = film.audit.findLast(
    (event) => event.kind === 'command' && event.move === 'hisoka:finisher',
  )!
  // Keep a real opening exchange and enough round time for the prepared finish.
  const cut = Math.min(Math.round(Number(command.second) * 60), 12 * 60)
  film.states = film.states.slice(0, cut)
  film.frames = film.frames.slice(0, cut)
  film.audit = film.audit.filter((event) => Number(event.second) < cut / 60)
  film.state = film.states.at(-1)!
  film.held = { player: {}, opponent: {} }
  for (
    let hit = 0;
    film.state.phase === 'fighting' && film.state.opponent.health > 40 && hit < 30;
    hit++
  ) {
    film.until(() => film.free('player') && film.free('opponent'))
    film.close('player', 4)
    film.hit('player', film.state.opponent.health > 65 ? 'standingHeavy' : 'standingLight')
  }
  film.until(() => film.free('player') && film.free('opponent'))
  film.close('player', 4)
  film.held.player = { down: true, aura: true }
  film.until(() => film.state.player.aura >= 99.9, 600)
  film.held.player = {}
  film.advance()
  film.hit('player', 'neutralSpecial')
  film.until(() => film.free('player') && film.free('opponent'))
  if (!film.state.bungeeGum)
    throw new Error(
      `Native tether must be attached: ${JSON.stringify({ phase: film.state.phase, health: [film.state.player.health, film.state.opponent.health], aura: film.state.player.aura, nen: film.state.player.nen.mode, last: film.audit.slice(-5) })}`,
    )
  const start = film.states.length
  film.retreat('player', 32)
  const recall = film.states.length
  film.hit('player', 'finisher')
  film.until(() => film.state.phase === 'finished')
  if (film.state.winner !== 'player')
    throw new Error(
      JSON.stringify({
        phase: film.state.phase,
        winner: film.state.winner,
        hp: film.state.opponent.health,
        gum: film.state.bungeeGum,
        last: film.audit.slice(-6),
      }),
    )
  const impact = film.states.findIndex((s, i) => i >= recall && s.opponent.health === 0)
  film.advance(60)
  const end = film.states.length - 1
  const sourceAt = (age: number) => {
    if (age < 120) return start + Math.floor(((recall - start) * age) / 120)
    if (age < 210) return recall + Math.floor(((impact - recall) * (age - 120)) / 90)
    if (age < 270) return impact + Math.floor(((end - impact) * (age - 210)) / 60)
    return end
  }
  const sources = Array.from({ length: start + 600 }, (_, i) =>
    i < start ? i : sourceAt(i - start),
  )
  const states = sources.map((source) => film.states[source])
  const camera = createCinematicTrack(film.states)
  const shots = ['tension', 'recall', 'impact', 'portrait', 'smile']
  const report = {
    ...film.report(),
    duration: states.length / 60,
    nativeDuration: film.states.length / 60,
    frameCount: states.length,
    victory: {
      startFrame: start,
      startSecond: start / 60,
      frameCount: 600,
      duration: 10,
      recall,
      impact,
      end,
      shots: [0, 120, 210, 270, 420].map((age, i) => ({
        kind: shots[i],
        frame: start + age,
        second: (start + age) / 60,
      })),
    },
    winner: film.state.winner,
    maximumFinalStretch: Math.max(
      ...film.states.slice(start, impact).map((s) => Math.abs(s.player.x - s.opponent.x)),
    ),
  }
  return { film, states, sources, camera, start, report }
}
