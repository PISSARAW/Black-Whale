import { actualDocuments } from './paperDocuments'
import { performPaperTextureCommand } from './paperTextureCommands'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export function paperTextureOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const commands = actualDocuments(state).flatMap((entry): ArsenalCommand[] => [
    { action: 'texture-paper', target: entry.id },
    { action: 'texture-paper-remove', target: entry.id },
  ])
  return commands.map((command) => ({
    command,
    labelFr: `Texture Surprise · ${command.action === 'texture-paper' ? 'Choisir' : 'Retirer le texte de'} ${command.target}`,
    labelEn: `Texture Surprise · ${command.action === 'texture-paper' ? 'Select' : 'Remove text from'} ${command.target}`,
    conditionFr:
      'Support réel au contact lors de l’application. L’apparence masque les mots sans réécrire l’encre, une prédiction ou un contrat de Nen.',
    conditionEn:
      'Actual support within reach when applied. Appearance covers words without rewriting ink, a prediction or a Nen contract.',
    ready: performPaperTextureCommand(state, side, command) !== state,
  }))
}
