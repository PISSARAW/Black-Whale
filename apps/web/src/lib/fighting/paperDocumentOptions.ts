import { actualDocuments, heldDocuments, paperBodyRef, samePaperBody } from './paperDocuments'
import { performPaperDocumentCommand } from './paperDocumentActions'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export function paperDocumentOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const commands: ArsenalCommand[] = []
  if (state[side].writingKit) commands.push({ action: 'document-draw' })
  for (const entry of heldDocuments(state, side)) {
    commands.push({ action: 'document-drop', target: entry.id })
    commands.push({ action: 'document-show', target: entry.id })
  }
  for (const entry of actualDocuments(state))
    if (!entry.document!.holder) commands.push({ action: 'document-take', target: entry.id })
  for (const entry of actualDocuments(state))
    commands.push({ action: 'document-read', target: entry.id })
  return commands.map((command) => ({
    command,
    labelFr: documentLabel(command, 'fr'),
    labelEn: documentLabel(command, 'en'),
    conditionFr:
      'Papier réel au contact et main disponible. Détacher une feuille consomme le stock réel du matériel porté ; déposer conserve le même objet.',
    conditionEn:
      'Actual paper within reach and an available hand. Drawing a sheet spends the carried kit’s real stock; dropping preserves the same object.',
    ready: performPaperDocumentCommand(state, side, command) !== state,
  }))
}

function documentLabel(command: ArsenalCommand, language: 'fr' | 'en'): string {
  if (command.action === 'document-read')
    return language === 'fr' ? `Papier · Lire ${command.target}` : `Paper · Read ${command.target}`
  if (command.action === 'document-show')
    return language === 'fr'
      ? `Papier · Montrer ${command.target}`
      : `Paper · Show ${command.target}`
  if (command.action === 'document-draw')
    return language === 'fr' ? 'Papier · Détacher une feuille vierge' : 'Paper · Draw a blank sheet'
  const drop = command.action === 'document-drop'
  return language === 'fr'
    ? `Papier · ${drop ? 'Déposer' : 'Prendre'} ${command.target}`
    : `Paper · ${drop ? 'Drop' : 'Take'} ${command.target}`
}

export function documentHeldBy(state: FightState, side: FightSide, id: string): boolean {
  const holder = actualDocuments(state).find((entry) => entry.id === id)?.document?.holder
  return Boolean(holder && samePaperBody(holder, paperBodyRef(state, side)))
}
