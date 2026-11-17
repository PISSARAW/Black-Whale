import { createMangaShowcase } from './mangaChoreography'
import { createCinematicTrack } from './cinematicCamera'

/** Native duel and native Sun/Moon detonation; the ten-second edit only retimes presentation. */
export function createChrolloVictoryFilm() {
  const film = createMangaShowcase()
  const command = film.audit.findLast((e) => e.kind === 'command' && e.move === 'chrollo:finisher')!
  const cut = Math.round(Number(command.second) * 60)
  film.states = film.states.slice(0, cut)
  film.frames = film.frames.slice(0, cut)
  film.audit = film.audit.filter((e) => Number(e.second) < Number(command.second))
  film.state = film.states.at(-1)!
  film.held = { player: {}, opponent: {} }
  film.until(() => film.free('player') && film.free('opponent'), 600)
  film.held.opponent = { down: true, aura: true }
  film.until(() => film.state.opponent.aura >= 99.9, 600)
  film.held.opponent = {}
  film.advance()
  for (
    let i = 0;
    film.state.opponent.chrolloBook?.pages[film.state.opponent.chrolloBook.page] !==
      'sun-and-moon' && i < 4;
    i++
  )
    film.book('backSpecial')
  if (!film.state.opponent.chrolloBook?.open) film.book('downSpecial')
  if (!film.state.player.hatsuEffects.sunMark) {
    film.close('opponent')
    film.hit('opponent', 'neutralSpecial')
    film.until(() => film.free('player') && film.free('opponent'))
  }
  for (let hit = 0; film.state.player.health > 48 && hit < 40; hit++) {
    film.until(() => film.free('player') && film.free('opponent'))
    film.close('opponent')
    film.hit('opponent', film.state.player.health > 85 ? 'standingHeavy' : 'standingLight')
  }
  film.held.opponent = { down: true, aura: true }
  film.until(() => film.state.opponent.aura >= 99.9, 600)
  film.held.opponent = {}
  film.advance()
  // The native Moon cast needs the Sun/Moon bookmark and a closed book.
  if (!film.state.opponent.chrolloBook?.open) film.book('downSpecial')
  if (film.state.opponent.chrolloBook?.bookmark === 'sun-and-moon') film.book('downSpecial')
  film.book('downSpecial')
  film.until(() => film.free('player') && film.free('opponent'))
  film.close('opponent')
  if (!film.state.player.hatsuEffects.sunMark || film.state.opponent.chrolloBook?.open)
    throw new Error('Sun mark and closed bookmarked book required before the Moon')
  const start = film.states.length
  film.hit('opponent', 'finisher')
  film.until(() => film.state.phase === 'finished')
  const explosion = film.states.findIndex(
    (s, i) =>
      i >= start &&
      s.player.hatsuEffects.sunMark === 0 &&
      s.player.health < film.states[start - 1].player.health,
  )
  if (film.state.winner !== 'opponent' || explosion < start)
    throw new Error(
      JSON.stringify({
        winner: film.state.winner,
        hp: film.state.player.health,
        book: film.state.opponent.chrolloBook,
        events: film.audit.slice(-5),
      }),
    )
  film.advance(60)
  const end = film.states.length - 1
  const sourceAt = (age: number) =>
    age < 180
      ? start + Math.floor(((explosion - start) * age) / 180)
      : age < 300
        ? explosion + Math.floor(((end - explosion) * (age - 180)) / 120)
        : end
  const sources = Array.from({ length: start + 600 }, (_, i) =>
    i < start ? i : sourceAt(i - start),
  )
  const states = sources.map((source) => film.states[source])
  return {
    film,
    states,
    sources,
    start,
    camera: createCinematicTrack(film.states),
    report: {
      ...film.report(),
      duration: states.length / 60,
      frameCount: states.length,
      winner: film.state.winner,
      victory: {
        startFrame: start,
        startSecond: start / 60,
        frameCount: 600,
        duration: 10,
        nativeExplosionFrame: explosion,
        explosionFrame: start + 180,
        explosionSecond: (start + 180) / 60,
        bookClosedFrame: start + 180,
        bookClosedSecond: (start + 180) / 60,
        end,
      },
    },
  }
}
