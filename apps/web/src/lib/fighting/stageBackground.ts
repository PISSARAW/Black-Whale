import type { Group } from 'three'
import type { SceneryKit } from './stageKit'
import type { FightStageId } from './stages'
import type { StageBackgroundContext } from './stageBackgroundTypes'
import { STAGE_BACKGROUND_SCENES } from './stageBackgroundScenes'
import { buildBackgroundItem } from './stageBackgroundItems'

export interface StageBackground {
  root: Group
  update: (seconds: number) => void
  dispose: () => void
}

function backgroundEvent(context: StageBackgroundContext) {
  const state = context.fight?.()
  return {
    round: state?.roundNumber ?? 0,
    phase: state?.phase ?? 'ready',
    impact: state?.impact?.sequence ?? -1,
  }
}

function backgroundReactions(context: StageBackgroundContext): (seconds: number) => number {
  let previous = backgroundEvent(context)
  let started = -100
  return (seconds) => {
    const event = backgroundEvent(context)
    if (event.round !== previous.round || event.phase === 'ready') started = -100
    else if (
      (event.impact > 0 && event.impact !== previous.impact) ||
      (event.phase === 'finished' && previous.phase !== 'finished')
    )
      started = seconds
    previous = event
    return Math.max(0, 1 - (seconds - started) / 1.8)
  }
}

/** Presentation only: each stage authors its own selection, placement and timing. */
export function buildStageBackground(
  kit: SceneryKit,
  stageId: FightStageId,
  context: StageBackgroundContext = {},
): StageBackground {
  const root = new kit.THREE.Group()
  root.name = `stage-background:${stageId}`
  root.userData.decorative = true
  const parts = STAGE_BACKGROUND_SCENES[stageId].map((element) =>
    buildBackgroundItem(kit, element, { stageId, context }),
  )
  parts.forEach((part) => root.add(part.root))
  const excitement = backgroundReactions(context)
  let origin: number | undefined
  let disposed = false
  return {
    root,
    update: (seconds) => {
      origin ??= seconds
      const reducedMotion = context.reducedMotion ?? false
      const frame = {
        seconds: reducedMotion ? 0 : seconds - origin,
        excitement: reducedMotion ? 0 : excitement(seconds),
        finished: !reducedMotion && context.fight?.().phase === 'finished',
        reducedMotion,
      }
      parts.forEach((part) => part.update(frame))
    },
    dispose: () => {
      if (disposed) return
      disposed = true
      parts.forEach((part) => part.dispose())
    },
  }
}
