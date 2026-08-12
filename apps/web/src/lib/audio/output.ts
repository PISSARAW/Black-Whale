import { writable } from 'svelte/store'

import { sharedAudioContext } from './context'

/**
 * The last thing every sound aboard passes through: three faders and a limiter.
 *
 * Two problems, one stage. The first is that nothing was ever mixed — the
 * theme, the walk and the techniques each ran a gain straight at
 * `destination`, so a burst of ten barrels fired in a room with the hull under
 * it and boots on top of it summed to whatever it summed to, and on a loud
 * report that is above one. Digital clipping is not a loud sound, it is a
 * broken one. The compressor below is set as a limiter — high ratio, fast
 * attack, a threshold a little under the ceiling — so the loudest moments lean
 * on it instead of tearing.
 *
 * The second is that the visitor's only controls were two on/off buttons. A
 * walk somebody keeps open for half an hour needs to be able to hold the
 * soundtrack down without silencing the ship, or keep the ship and drop the
 * techniques. Three faders, remembered between visits, and each one is exactly
 * the bus a toggle used to switch.
 */

/** The three things the ship makes noise with. */
export type Bus = 'ambient' | 'walk' | 'effects'

export const BUSES: readonly Bus[] = ['ambient', 'walk', 'effects']

export type Levels = Record<Bus, number>

const KEY = 'black-whale:audio-levels'

/**
 * Where the faders sit for a visitor who has never touched them.
 *
 * The theme sits under the other two on purpose: it is a soundtrack over the
 * archive, and the walk and its techniques are the ship itself.
 */
export const DEFAULT_LEVELS: Levels = { ambient: 0.75, walk: 1, effects: 1 }

const clamp = (value: number) => Math.min(1, Math.max(0, value))

function storedLevels(): Levels {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_LEVELS }
  const raw = localStorage.getItem(KEY)
  if (!raw) return { ...DEFAULT_LEVELS }
  try {
    const held = JSON.parse(raw) as Partial<Record<Bus, unknown>>
    const levels = { ...DEFAULT_LEVELS }
    for (const bus of BUSES) {
      const value = held[bus]
      if (typeof value === 'number' && Number.isFinite(value)) levels[bus] = clamp(value)
    }
    return levels
  } catch {
    return { ...DEFAULT_LEVELS }
  }
}

let levels = storedLevels()

/** Where the three faders are, for the panel that draws them. */
export const audioLevels = writable<Levels>({ ...levels })

interface Stage {
  buses: Record<Bus, GainNode>
  limiter: DynamicsCompressorNode
}

const stages = new WeakMap<AudioContext, Stage>()

function buildStage(context: AudioContext): Stage {
  // A limiter rather than a compressor: the ratio is high enough and the knee
  // narrow enough that nothing below the threshold is touched at all. Quiet
  // rooms are unaffected; only a cast landing over a running engine ever meets
  // it, and what it meets there is a ceiling instead of a clip.
  const limiter = context.createDynamicsCompressor()
  limiter.threshold.value = -9
  limiter.knee.value = 4
  limiter.ratio.value = 14
  limiter.attack.value = 0.004
  limiter.release.value = 0.22
  limiter.connect(context.destination)

  const make = (bus: Bus) => {
    const gain = context.createGain()
    gain.gain.value = levels[bus]
    gain.connect(limiter)
    return gain
  }

  return {
    buses: { ambient: make('ambient'), walk: make('walk'), effects: make('effects') },
    limiter,
  }
}

function stageFor(context: AudioContext): Stage {
  const held = stages.get(context)
  if (held) return held
  const built = buildStage(context)
  stages.set(context, built)
  return built
}

/**
 * The node a graph's master should end on, instead of `destination`.
 *
 * Null where there is no context at all, which is the server and a browser
 * without Web Audio; a caller that gets null simply stays silent.
 */
export function outputBus(bus: Bus): GainNode | null {
  const context = sharedAudioContext()
  return context ? stageFor(context).buses[bus] : null
}

/** Where a fader is now, without subscribing to the store. */
export const audioLevel = (bus: Bus): number => levels[bus]

/**
 * Moves a fader.
 *
 * Ramped over a fifth of a second rather than set: an audio parameter written
 * to directly steps, and a step in a gain is a click. Dragging a slider writes
 * this a few dozen times a second, and every one of them is a ramp from where
 * the last one had got to.
 */
export function setAudioLevel(bus: Bus, value: number): void {
  const level = clamp(value)
  levels = { ...levels, [bus]: level }
  audioLevels.set({ ...levels })
  if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(levels))
  const context = sharedAudioContext()
  if (!context) return
  const node = stageFor(context).buses[bus]
  const now = context.currentTime
  node.gain.cancelScheduledValues(now)
  node.gain.setTargetAtTime(level, now, 0.07)
}
