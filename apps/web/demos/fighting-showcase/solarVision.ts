import { futureVisibleState } from '../../src/lib/fighting/parallelFuturePresentation'
import type { FightState } from '../../src/lib/fighting/types'
import { createCinematicTrack } from './cinematicCamera'
import type { CinematicFrame } from './cinematicCamera'
import { PerspectiveCamera, Vector3 } from 'three'
import { fightWorldX, fightWorldY } from '../../src/lib/fighting/fightCoordinates'

function insetOverlaps(
  states: FightState[],
  frames: CinematicFrame[],
  range: {
    start: number
    end: number
    inset: { x: number; y: number; width: number; height: number }
  },
) {
  const inset = range.inset
  const camera = new PerspectiveCamera(34, 1920 / 858, 0.1, 100)
  let violations = 0
  for (let index = range.start; index < range.end; index++) {
    const frame = frames[index]
    camera.position.set(frame.x, frame.lookY + 0.55, frame.z)
    camera.lookAt(frame.x, frame.lookY, 0)
    camera.updateMatrixWorld(true)
    for (const fighter of [states[index].player, states[index].opponent]) {
      const points = []
      for (const dx of [-0.72, 0.72])
        for (const height of [0.03, 2.22]) {
          const p = new Vector3(
            fightWorldX(fighter.x) + dx,
            fightWorldY(fighter.y) + height,
            0.12,
          ).project(camera)
          points.push({ x: (p.x + 1) * 960, y: 76 + (1 - p.y) * 429 })
        }
      const left = Math.min(...points.map((p) => p.x)),
        right = Math.max(...points.map((p) => p.x))
      const top = Math.min(...points.map((p) => p.y)),
        bottom = Math.max(...points.map((p) => p.y))
      if (
        left < inset.x + inset.width &&
        right > inset.x &&
        top < inset.y + inset.height &&
        bottom > inset.y
      )
        violations++
    }
  }
  return violations
}

/** This is Feitan's perceived branch, rendered separately from the unchanged real duel. */
export function createSolarVision(states: FightState[], realCamera?: CinematicFrame[]) {
  const perceived = states.map((state) => ({
    ...futureVisibleState(state, 'player'),
    parallelFuture: undefined,
  }))
  const start = states.findIndex((state) => state.parallelFuture?.phase === 'diverging')
  const end = states.findIndex(
    (state, index) => index > start && !state.player.hatsuEffects.painPacker?.sun,
  )
  const camera = createCinematicTrack(perceived)
  const realFrames = realCamera ?? createCinematicTrack(states).frames
  const layouts = [600, 580, 560, 540, 520, 500, 480, 460].flatMap((width) =>
    [700, 720, 740, 760, 780, 800, 820, 840].map((x) => {
      const inset = { x, y: 490, width, height: Math.round(((width - 4) * 858) / 1920) + 4 }
      return { inset, overlaps: insetOverlaps(states, realFrames, { start, end, inset }) }
    }),
  )
  const layout = layouts.find((candidate) => candidate.overlaps === 0) ?? layouts.at(-1)!
  const inset = layout.inset
  return {
    states: perceived,
    camera,
    report: {
      startFrame: start,
      endFrame: end,
      startSecond: start / 60,
      endSecond: end / 60,
      predictedDamage: perceived[start].opponent.health - perceived[end - 1].opponent.health,
      realDamage: states[start].opponent.health - states[end - 1].opponent.health,
      predictedKoFrame: perceived.findIndex(
        (state, index) => index >= start && state.opponent.health === 0,
      ),
      framingViolations: camera.report.framingViolations,
      inset,
      insetBodyOverlaps: layout.overlaps,
    },
    damageAt(index: number) {
      return Math.max(
        0,
        perceived[Math.max(0, index - 8)].opponent.health - perceived[index].opponent.health,
      )
    },
  }
}
