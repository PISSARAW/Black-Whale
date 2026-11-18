import { benjaminCanRewindMusse } from './benjaminMusseArchive'
import type { RecordedWindowObservation } from './benjaminMusseArchive'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export function performRecordedWindowCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (command.action !== 'window-recorded' || !benjaminCanRewindMusse(state, side)) return state
  const actor = state[side]
  const baton = actor.hatsuEffects.baton!
  const archive = baton.musseArchive!
  const frame = archive.observed?.find((entry) => entry.id === command.target)
  if (!frame || frame.id === archive.observedCursor) return state
  return {
    ...state,
    [side]: {
      ...actor,
      hatsuEffects: {
        ...actor.hatsuEffects,
        baton: {
          ...baton,
          musseArchive: { ...archive, cursor: undefined, observedCursor: frame.id },
        },
      },
    },
  }
}

export function recordedWindowOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const archive = state[side].hatsuEffects.baton?.musseArchive
  const observed = archive?.observed ?? []
  const last = observed.at(-1)
  if (!last) return []
  const ready = benjaminCanRewindMusse(state, side)
  const selected = observed.findIndex((entry) => entry.id === archive?.observedCursor)
  const make = (
    frame: RecordedWindowObservation,
    names: readonly [string, string],
  ): ArsenalOption => ({
    command: { action: 'window-recorded', target: frame.id },
    labelFr: `Secret Window · ${names[0]}`,
    labelEn: `Secret Window · ${names[1]}`,
    ready: ready && archive?.observedCursor !== frame.id,
    conditionFr:
      'Relecture d’un geste ou d’une parole réellement reçu de Camilla par le hibou hérité. Aucune pensée ni identité de technique cachée.',
    conditionEn:
      'Replays an action or utterance actually received from Camilla through the inherited owl. No thoughts or hidden technique identity.',
  })
  const options = [make(last, ['Revoir la dernière vue reçue', 'Replay latest received view'])]
  if (selected > 0)
    options.push(make(observed[selected - 1], ['Vue reçue précédente', 'Previous received view']))
  if (selected >= 0 && selected < observed.length - 2)
    options.push(make(observed[selected + 1], ['Vue reçue suivante', 'Next received view']))
  return options
}
