import { arenaObjects } from './arenaActions'
import { ownsBungeeGum } from './hisokaArsenal'
import { gumObjectAnchors } from './gumObjectAnchors'
import { performGumObjectAnchorCommand } from './gumObjectAnchorCommands'
import { stolenAuraActor, withDolphinSupply } from './dolphinSupply'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export function gumObjectAnchorOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const actor = state[side]
  if (!ownsBungeeGum(stolenAuraActor(actor)) && !gumObjectAnchors(actor).length) return []
  const options = arenaObjects(state).map((entry, index) =>
    option(state, side, {
      action: 'gum-anchor-attach',
      target: entry.id,
      fr: `Ancrer au support ${index + 1} au contact`,
      en: `Attach to support ${index + 1} at contact`,
    }),
  )
  for (const [index, anchor] of gumObjectAnchors(actor).entries())
    for (const command of CONTROLS)
      options.push(
        option(state, side, {
          action: command.action,
          target: anchor.objectId,
          fr: `Fil ${index + 1} · ${command.fr}`,
          en: `Strand ${index + 1} · ${command.en}`,
        }),
      )
  return options
}
const CONTROLS = [
  { action: 'gum-anchor-self', fr: 'Se tirer vers le support', en: 'Reel yourself toward support' },
  {
    action: 'gum-anchor-object',
    fr: 'Tirer le support vers soi',
    en: 'Reel support toward yourself',
  },
  { action: 'gum-anchor-stop', fr: 'Arrêter la traction', en: 'Stop reeling' },
  { action: 'gum-anchor-release', fr: 'Détacher ce fil', en: 'Detach this strand' },
] as const
function option(
  state: FightState,
  side: FightSide,
  command: { action: ArsenalCommand['action']; target: string; fr: string; en: string },
): ArsenalOption {
  const { action, target } = command
  return {
    command: { action, target },
    labelFr: `Bungee Gum · ${command.fr}`,
    labelEn: `Bungee Gum · ${command.en}`,
    ready:
      withDolphinSupply(state, side, (supplied) =>
        performGumObjectAnchorCommand(supplied, side, { action, target }),
      ) !== state,
    conditionFr:
      'Support physique réel et contact avant adhésion. Chaque fil reste indépendant ; traction matérielle, sans invulnérabilité. Coût et vitesse : réglages de duel.',
    conditionEn:
      'Actual physical support and contact before attachment. Each strand stays independent; physical reeling without invulnerability. Cost and speed are duel tuning.',
  }
}
