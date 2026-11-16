import { fightWorldX } from '../../src/lib/fighting/fightCoordinates'
import type { Showcase, DemoFrame } from './timeline'
import type { CinematicFrame } from './cinematicCamera'

export interface CatShot {
  kind: 'apparition' | 'capture' | 'crush' | 'resurrection' | 'victory'
  progress: number
  source: number
  revivalAge?: number
  camera: CinematicFrame
}

const smooth = (t: number) => {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

/** Only the presentation slows down. The first thirty seconds and all native outcomes stay intact. */
export function createCatsSpectacle(film: Showcase) {
  const frames: DemoFrame[] = []
  const shots: Array<CatShot | undefined> = []
  const victoryFrame = film.states.findIndex((s) => s.phase === 'finished')
  const startFrame = film.states.findIndex((s) => Boolean(s.catsName))
  for (let source = 0; source < film.frames.length; source++) {
    const view = film.frames[source]
    const repeats = view.state.catsName ? 4 : source === film.frames.length - 1 ? 61 : 1
    for (let sub = 0; sub < repeats; sub++) {
      frames.push(view)
      shots.push(
        source >= startFrame
          ? shotAt(view, source, view.state.catsName ? sub : source - victoryFrame)
          : undefined,
      )
    }
  }
  return {
    frames,
    shots,
    report: {
      startFrame,
      startSecond: startFrame / 60,
      frameCount: frames.length,
      duration: frames.length / 60,
      slowMotion: 4,
      nativeCatFrames: 120,
      unchangedOpeningFrames: startFrame,
      shots: shots.flatMap((shot, i) =>
        shot && shot.kind !== shots[i - 1]?.kind
          ? [{ kind: shot.kind, second: i / 60, frame: i }]
          : [],
      ),
    },
  }
}

function shotAt(view: DemoFrame, source: number, sub: number): CatShot {
  const state = view.state
  const f = state.catsName ? state.catsName.frame + sub / 4 : 120
  const killer = fightWorldX(state.player.x)
  const victim = fightWorldX(state.opponent.x)
  let kind: CatShot['kind'], x: number, lookY: number, z: number, yaw: number
  if (f < 24) {
    kind = 'apparition'
    const t = smooth(f / 24)
    x = killer
    lookY = 0.1 + Math.min(1, (f + 1) / 24) * 2.2
    z = 2.6 + t * 0.4
    yaw = -0.12 + t * 0.12
  } else if (f < 48) {
    kind = 'capture'
    const t = smooth((f - 24) / 24)
    x = killer
    lookY = 1.2
    z = 4.1 - t * 0.3
    yaw = 0.04
  } else if (f < 84) {
    kind = 'crush'
    const t = smooth((f - 48) / 36)
    x = killer
    lookY = 1.2
    z = 3.8 - t * 0.2
    yaw = 0.04
  } else if (f < 120) {
    kind = 'resurrection'
    const t = smooth((f - 84) / 36)
    x = victim + 0.65
    lookY = 0.55
    z = 3.5 - t * 0.3
    yaw = 0.4
  } else {
    kind = 'victory'
    const t = smooth(sub / 45)
    x = victim
    lookY = 1.55 + t * 0.05
    z = 3.9 - t * 0.5
    yaw = 0.1
  }
  return {
    kind,
    progress: f,
    source,
    revivalAge: f >= 120 ? sub : undefined,
    camera: { x, lookY, z, yaw, intensity: 1.2 },
  }
}
