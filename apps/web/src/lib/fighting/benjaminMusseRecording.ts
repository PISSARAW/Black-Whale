import { arsenalMindAvailable } from './arsenalMind'
import { benjaminArchiveObserverReady } from './benjaminMusseArchive'
import type { RecordedWindowObservation } from './benjaminMusseArchive'
import type { ArcadeFighter, FightState } from './types'

/** A bounded presentation journal, not a newly invented Nen duration or memory limit. */
export const WINDOW_OBSERVATION_CACHE = 256

/** Store only observations actually received by this mind; never query private attack data. */
export function recordWindowObservation(
  state: FightState,
  actor: ArcadeFighter,
  words?: { frame: number; text: string },
): ArcadeFighter {
  if (!benjaminArchiveObserverReady(state, actor) || !arsenalMindAvailable(actor)) return actor
  const archive = actor.hatsuEffects.baton!.musseArchive!
  const feed = actor.secretWindow!
  const previous = archive.observed?.at(-1)
  const sample = {
    round: state.roundNumber,
    frame: state.frame,
    action: feed.observation.action,
    words,
  }
  if (sameObservation(previous, sample)) return actor
  const ordinal = (archive.observedOrdinal ?? 0) + 1
  const observed = [...(archive.observed ?? []), { ...sample, id: `observation:${ordinal}` }].slice(
    -WINDOW_OBSERVATION_CACHE,
  )
  const observedCursor = observed.some((entry) => entry.id === archive.observedCursor)
    ? archive.observedCursor
    : undefined
  return {
    ...actor,
    hatsuEffects: {
      ...actor.hatsuEffects,
      baton: {
        ...actor.hatsuEffects.baton!,
        musseArchive: {
          ...archive,
          observed,
          observedOrdinal: ordinal,
          observedCursor,
        },
      },
    },
  }
}

function sameObservation(
  previous: RecordedWindowObservation | undefined,
  sample: Omit<RecordedWindowObservation, 'id'>,
): boolean {
  if (!previous) return false
  return (
    previous.round === sample.round &&
    previous.action === sample.action &&
    sameWords(previous, sample)
  )
}
function sameWords(
  previous: RecordedWindowObservation,
  sample: Omit<RecordedWindowObservation, 'id'>,
): boolean {
  return (
    previous.words?.frame === sample.words?.frame && previous.words?.text === sample.words?.text
  )
}
