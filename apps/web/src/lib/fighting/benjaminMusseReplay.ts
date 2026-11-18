import { MUSSE_ARCHIVE, benjaminCanRewindMusse } from './benjaminMusseArchive'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

export function performMusseArchiveCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (command.action === 'window-archive-close') return closeArchive(state, side)
  if (command.action !== 'window-archive') return state
  const actor = state[side]
  if (!benjaminCanRewindMusse(state, side)) return state
  const baton = actor.hatsuEffects.baton!
  const archive = baton.musseArchive!
  const cursor = MUSSE_ARCHIVE.findIndex((frame) => frame.id === command.target)
  if (cursor === -1 || cursor === archive.cursor) return state
  return {
    ...state,
    [side]: {
      ...actor,
      hatsuEffects: {
        ...actor.hatsuEffects,
        baton: { ...baton, musseArchive: { ...archive, cursor, observedCursor: undefined } },
      },
    },
  }
}

export function musseArchiveOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const actor = state[side]
  const archive = actor.hatsuEffects.baton?.musseArchive
  if (!archive) return missingArchiveOptions(actor)
  const frames: ArsenalOption[] = MUSSE_ARCHIVE.map((frame) => ({
    command: { action: 'window-archive', target: frame.id },
    labelFr: `Secret Window · Revoir : ${frame.fr}`,
    labelEn: `Secret Window · Replay: ${frame.en}`,
    ready: benjaminCanRewindMusse(state, side) && archive.cursor !== MUSSE_ARCHIVE.indexOf(frame),
    conditionFr:
      'Benjamin rétrospectif : héritage de Musse et longue surveillance continue déjà accomplis. Vision passée de Musse jusqu’à sa mort ; aucune image du présent adversaire ou de l’avenir.',
    conditionEn:
      'Retrospective Benjamin: Musse inheritance and prolonged uninterrupted monitoring already completed. Musse’s past vision up to his death; no footage of the present opponent or future.',
  }))
  if (archive.cursor !== undefined || archive.observedCursor !== undefined)
    frames.push({
      command: { action: 'window-archive-close' },
      labelFr: 'Secret Window · Fermer la relecture',
      labelEn: 'Secret Window · Close playback',
      ready: true,
      conditionFr: 'Quitter la vision enregistrée ne déplace pas le hibou de surveillance actuel.',
      conditionEn: 'Leaving the recorded vision does not move the current surveillance owl.',
    })
  return frames
}

function closeArchive(state: FightState, side: FightSide): FightState {
  const actor = state[side]
  if ((actor.nenOwner ?? actor.id) !== 'benjamin') return state
  const baton = actor.hatsuEffects.baton
  const archive = baton?.musseArchive
  if (!archive || (archive.cursor === undefined && archive.observedCursor === undefined))
    return state
  return {
    ...state,
    [side]: {
      ...actor,
      hatsuEffects: {
        ...actor.hatsuEffects,
        baton: {
          ...baton!,
          musseArchive: { ...archive, cursor: undefined, observedCursor: undefined },
        },
      },
    },
  }
}

function missingArchiveOptions(actor: ArcadeFighter): ArsenalOption[] {
  if ((actor.nenOwner ?? actor.id) !== 'benjamin') return []
  return [
    {
      command: { action: 'window-archive', target: MUSSE_ARCHIVE[0].id },
      labelFr: 'Secret Window · Relecture de Musse',
      labelEn: 'Secret Window · Musse playback',
      ready: false,
      conditionFr:
        'Préparer le scénario Benjamin–Camilla : hibou réellement hérité de Musse et longue surveillance continue déjà accomplie. Aucun passé arbitraire de l’adversaire.',
      conditionEn:
        'Prepare the Benjamin–Camilla scenario: Musse’s actual inherited owl and completed prolonged monitoring. No arbitrary opponent history.',
    },
  ]
}
