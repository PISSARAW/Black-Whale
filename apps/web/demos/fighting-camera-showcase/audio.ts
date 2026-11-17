import { makeChapter } from './film'
import { renderShowcaseAudio } from '../fighting-showcase/audio'
import type { FighterId } from '../../src/lib/fighting/types'
import { makeLongChapter, longAudioStates } from './longFilm'
const id = new URLSearchParams(location.search).get('id') as FighterId
// A fresh document gives each offline render its own shared audio context and output buses.
const long = new URLSearchParams(location.search).get('version') === 'long'
Object.assign(window, {
  cameraFilmAudio: () =>
    renderShowcaseAudio(long ? longAudioStates(makeLongChapter(id)) : makeChapter(id).states),
})
