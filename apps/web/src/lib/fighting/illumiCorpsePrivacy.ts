import type { FightSide, FightState, ArcadeFighter } from './types'

export function concealCorpseWorld(state: FightState, viewer: FightSide): void {
  const field = state.battlefield
  if (!field) return
  field.entities = field.entities.map((entry) =>
    entry.corpseControl && entry.corpseControl.owner.owner !== viewer
      ? { ...entry, corpseControl: { ...entry.corpseControl, origin: undefined } }
      : entry,
  )
}

export function redactCorpsePreparation(actor: ArcadeFighter): void {
  if (actor.corpsePreparation)
    actor.corpsePreparation = { ...actor.corpsePreparation, origin: undefined }
}
