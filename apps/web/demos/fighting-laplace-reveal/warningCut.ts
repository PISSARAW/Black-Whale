import { createLaplaceRevealFilm } from './film'
import { futureVisibleState } from '../../src/lib/fighting/parallelFuturePresentation'
import { fightWorldX } from '../../src/lib/fighting/fightCoordinates'
import type { CinematicFrame } from '../../src/lib/fighting/cinematicTrack'
import type { FightSide } from '../../src/lib/fighting/types'

export const warningStage = 'tserriednich-salon' as const
const film = createLaplaceRevealFilm({ counter: false, projectedShot: true })
export const proof = film.report

interface Beat {
  seconds: number
  from: number
  to: number
  viewer: FightSide
  kicker?: string
  line?: string
  focus?: FightSide
  settle?: boolean
  perception?: boolean
}

const beats: Beat[] = [
  {
    seconds: 4,
    from: 0,
    to: 57,
    viewer: 'player',
    kicker: 'ROOM 1004 · SUNDAY 19:35',
    line: 'Warning',
  },
  {
    seconds: 5,
    from: 60,
    to: 113,
    viewer: 'opponent',
    focus: 'opponent',
    kicker: 'TSERRIEDNICH',
    line: 'I closed my eyes.',
  },
  {
    seconds: 3,
    from: proof.killed - 80,
    to: proof.killed - 36,
    viewer: 'player',
    focus: 'player',
    kicker: 'THETA',
  },
  {
    seconds: 5,
    from: proof.killed - 36,
    to: proof.killed + 54,
    viewer: 'player',
    kicker: 'WHAT THETA SAW',
    perception: true,
  },
  { seconds: 3, from: proof.killed + 54, to: proof.killed + 54, viewer: 'player' },
  {
    seconds: 8,
    from: 90,
    to: proof.killed + 54,
    viewer: 'opponent',
    kicker: 'THE SAME TEN SECONDS',
    line: 'I had already stepped aside.',
  },
  {
    seconds: 6,
    from: proof.reveal - 22,
    to: proof.reveal + 42,
    viewer: 'opponent',
    focus: 'opponent',
    kicker: 'PARALLEL FUTURE',
    line: 'Laplace’s Demon',
    settle: true,
  },
]
export const warningDuration = beats.reduce((total, { seconds }) => total + seconds, 0)
export const melodyCut = { start: 17, duration: 3 }
const splitFrames = proof.divergence
export const splitDuration = splitFrames / 60
const splitStart = proof.reveal - splitFrames
const starts = beats.map((_, index) =>
  beats.slice(0, index).reduce((total, { seconds }) => total + seconds, 0),
)

function shotAt(seconds: number) {
  const index = starts.findLastIndex((start) => start <= seconds)
  const beat = beats[index]
  const t = Math.min(1, (seconds - starts[index]) / beat.seconds)
  const frame = Math.round(beat.from + (beat.to - beat.from) * t)
  const real = film.states[frame]
  const state = visibleCut(real, beat.viewer)
  return { beat, frame, state, real, t }
}

function visibleCut(real: (typeof film.states)[number], viewer: FightSide) {
  if (viewer !== 'opponent' || !real.futurePerception) return futureVisibleState(real, viewer)
  const projection = real.futurePerception
  return {
    ...real,
    player: { ...real.player, attack: projection.player.attack },
    projectiles: projection.projectiles,
  }
}

export function warningFrame(seconds: number) {
  const { beat, state, real, frame, t } = shotAt(seconds)
  const focus = beat.perception && frame >= proof.killed ? 'opponent' : beat.focus
  const px = fightWorldX(state.player.x)
  const ox = fightWorldX(state.opponent.x)
  const fallen = beat.perception && frame >= proof.killed
  const princeOffset = fallen ? 1.1 : beat.settle ? 0.65 : 0.38
  const camera: CinematicFrame = {
    x: focus === 'player' ? px : focus === 'opponent' ? ox + princeOffset : (px + ox) / 2,
    lookY: fallen ? 0.73 : focus ? 1.12 : 1.02,
    z: fallen || beat.settle ? 4.4 : focus ? 3.65 - t * 0.22 : 6.4 - t * 0.36,
    intensity: 0.5,
    focus,
  }
  return {
    ...beat,
    camera,
    state,
    reveal: Boolean(beat.settle && !real.futurePerception),
    shotFlash: beat.viewer === 'player' && frame >= proof.killed - 4 && frame < proof.killed + 1,
  }
}

export function warningAudioStates() {
  return Array.from({ length: warningDuration * 60 }, (_, index) => warningFrame(index / 60).state)
}

export function splitWarningFrame(seconds: number, viewer: FightSide) {
  const frame = splitStart + Math.min(splitFrames - 1, Math.max(0, Math.floor(seconds * 60)))
  const real = film.states[frame]
  const state = visibleCut(real, viewer)
  const perceived = viewer === 'player'
  const fallen = perceived && frame >= proof.killed
  const px = fightWorldX(state.player.x)
  const ox = fightWorldX(state.opponent.x)
  const focus = !perceived || fallen ? 'opponent' : undefined
  const camera: CinematicFrame = {
    x: focus ? ox + (fallen ? 0.85 : 0.42) : (px + ox) / 2,
    lookY: fallen ? 0.68 : 1.05,
    z: focus ? 4.2 : 6.65,
    intensity: 0.45,
    focus,
  }
  return {
    viewer,
    state,
    camera,
    kicker: perceived ? 'THETA' : 'TSERRIEDNICH',
    line: perceived ? 'What she sees' : 'What really happens',
    perception: perceived,
    settle: false,
    reveal: false,
    shotFlash: perceived && frame >= proof.killed - 4 && frame < proof.killed + 1,
  }
}

export function splitWarningAudioStates() {
  return Array.from({ length: splitFrames }, (_, index) =>
    futureVisibleState(film.states[splitStart + index], 'player'),
  )
}
