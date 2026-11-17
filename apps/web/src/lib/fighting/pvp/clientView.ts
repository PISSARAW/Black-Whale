import { decodeFightSnapshot } from '../fightReplaySnapshot'
import { fightReplayHash } from '../fightReplayHash'
import { pvpConfigHash } from './config'
import { PVP_RULESET, type PvpView } from './types'

export function decodePvpView(view: PvpView) {
  if (view.ruleset !== PVP_RULESET) throw Error('VERSION')
  if (view.configHash !== pvpConfigHash(view.setup)) throw Error('DIVERGED')
  validateEnvelope(view)
  const local = view.side === 'player'
  const state = decodeFightSnapshot(view.snapshot, {
    ...view.setup,
    mode: 'versus-ai',
    player: local ? view.setup.player : view.setup.opponent,
    opponent: local ? view.setup.opponent : view.setup.player,
  })
  if (fightReplayHash(state) !== view.snapshotHash) throw Error('DIVERGED')
  return state
}

function validateEnvelope(view: PvpView) {
  if (
    ![
      view.inputEpoch,
      view.tick,
      view.revision,
      view.nextSequence,
      view.appliedSequence,
      view.appliedAtTick,
    ].every((value) => Number.isSafeInteger(value) && value >= 0)
  )
    throw Error('DIVERGED')
  if (view.appliedSequence > view.nextSequence || view.appliedAtTick > view.tick)
    throw Error('DIVERGED')
  if (view.side !== 'player' && view.side !== 'opponent') throw Error('DIVERGED')
}
