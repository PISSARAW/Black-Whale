/**
 * The voyage theme is synthesised rather than streamed: a Hunter × Hunter (2011)
 * flavoured piece — a slow minor-key ocarina line over a string pad with sparse
 * celesta answers — written as a note schedule instead of an audio file. That
 * keeps the soundtrack original, adds no megabytes to the page, and gives the
 * Hatsu layer a real audio graph to reach into when a technique seals hearing.
 *
 * Four things had grown into one file, held together by the one thing they
 * really share: the mixer. ADR-002 separates them — `ambient/mixer` owns the
 * single AudioContext and the filter that seals hearing, and the theme, Melody's
 * flute and Bonolenov's dance are each written against it. Callers still name
 * this file, and the Hatsu voices in `hatsu/` still reach the same graph.
 */

export type { Graph, Note } from './ambient/mixer'

export {
  ambientMuffled,
  hatsuAudioGraph,
  midiToHz,
  setAmbientMuffled,
  voice,
} from './ambient/mixer'
export {
  ambientPlaying,
  ambientWasEnabled,
  startAmbient,
  stopAmbient,
  toggleAmbient,
} from './ambient/theme'
export { playHatsuNote } from './ambient/flute'
export { startBattleMusic, stopBattleMusic } from './ambient/battle'
