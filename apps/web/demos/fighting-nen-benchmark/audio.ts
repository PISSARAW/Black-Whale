import { makeNenBout } from './film'
import { renderShowcaseAudio } from '../fighting-showcase/audio'
const index = Number(new URLSearchParams(location.search).get('chapter') ?? 0)
Object.assign(window, { nenFilmAudio: () => renderShowcaseAudio(makeNenBout(index).states) })
