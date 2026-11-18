import { createLastContactFilm } from './lastContactFilm'
import { renderShowcaseAudio } from './audio'
const film = createLastContactFilm()
Object.assign(window, {
  clashAudio: {
    count: film.states.length,
    render: (range: { start: number; end: number }) =>
      renderShowcaseAudio(film.states.slice(range.start, range.end)),
  },
})
