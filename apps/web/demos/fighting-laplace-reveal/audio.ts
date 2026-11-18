import { createLaplaceRevealFilm } from './film'
import { renderShowcaseAudio } from '../fighting-showcase/audio'
Object.assign(window, {
  laplaceAudio: () => renderShowcaseAudio(createLaplaceRevealFilm().visibleStates),
})
