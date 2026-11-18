import { arsenalOptions } from './retrospectiveArsenal'
import { performArsenalAction } from './arsenalExecution'
import { documentById, paperBodyRef, samePaperBody } from './paperDocuments'
import { paperTextureLive } from './paperTexture'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightState } from './types'

/** A surface exercise uses only a reachable real document and the same player commands. */
export function paperTextureAi(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  if (!hasPaperOpportunity(state)) return null
  const actor = state.opponent
  const options = arsenalOptions(state, 'opponent')
  const paper = documentById(state, actor.texturePaperId)
  const selected = actor.textureTarget === 'paper' && paper
  let command = selected
    ? options.find(isTextureApplication)?.command
    : options.find((option) => option.ready && option.command.action === 'texture-paper')?.command
  if (!command) return null
  if (selected && actor.texturePaperDraft === '') command = prepareAiText(command)
  const next = performArsenalAction({ state, side: 'opponent', command }, perform)
  return next === state ? null : next
}

function prepareAiText(command: ArsenalCommand): ArsenalCommand {
  return {
    action: 'texture-paper-text',
    target: 'Document · ...',
    loan: command.loan || command.action === 'dolphin-move',
  }
}

function hasPaperOpportunity(state: FightState): boolean {
  if (Math.abs(state.player.x - state.opponent.x) <= 12) return false
  const documents = state.battlefield?.entities.filter((entry) => entry.document)
  if (!documents?.length) return false
  const owner = paperBodyRef(state, 'opponent')
  return !documents.some((entry) =>
    entry.document?.textures?.some(
      (layer) => samePaperBody(layer.owner, owner) && paperTextureLive(state, entry, layer),
    ),
  )
}

function isTextureApplication(option: ArsenalOption): boolean {
  if (!option.ready) return false
  if (option.command.action === 'texture-apply') return true
  return (
    option.command.target === 'hisoka:downSpecial' &&
    ['copied-move', 'dolphin-move'].includes(option.command.action)
  )
}
