import { renderShowcaseAudio } from '../../demos/fighting-showcase/audio'
import { createHisokaMachiAudioStates } from './demo'

Object.assign(window, {
  hisokaMachiAudio: () => renderShowcaseAudio(createHisokaMachiAudioStates()),
})
