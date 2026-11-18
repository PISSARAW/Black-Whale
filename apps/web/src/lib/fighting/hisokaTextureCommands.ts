import { canAct } from './fightActorState'
import { newGumSource, gumSourceCommandAllowed } from './bungeeSource'
import { chrolloAbilityActive } from './chrolloAbilityActive'
import { equippedDolphin } from './dolphinBorrowing'
import { chainAbilityGroup } from './chainAbilityGroup'
import { voluntaryNenAvailable } from './nenAccess'
import { textureTargetAvailable } from './hisokaTextureOrigin'
import { canUseMovesetMove, moveById } from './movesets'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

function textureSelectable(actor: ArcadeFighter): boolean {
  if (!voluntaryNenAvailable(actor)) return false
  if (newGumSource(actor).source !== 'dolphin')
    return (
      actor.id === 'hisoka' ||
      (actor.id === 'chrollo' && chrolloAbilityActive(actor, 'hisoka:downSpecial'))
    )
  const held = equippedDolphin(actor)
  return Boolean(
    held?.loaded &&
    !held.returned &&
    held.source === 'hisoka' &&
    chainAbilityGroup(held.moveId) === 'texture-surprise',
  )
}

export function performTextureCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  const actor = state[side]
  if (!canAct(actor) || actor.attack) return state
  if (command.action === 'texture-remove') return removeTexture(state, side)
  if (!textureSelectable(actor)) return state
  if (command.target !== 'cloth' && command.target !== 'gum-prostheses') return state
  if ((actor.textureTarget ?? 'cloth') === command.target) return state
  const selected: ArcadeFighter = { ...actor, textureTarget: command.target }
  return textureTargetAvailable(selected) ? { ...state, [side]: selected } : state
}

function removeTexture(state: FightState, side: FightSide): FightState {
  const texture = state[side].textureSurprise
  if (!texture || !gumSourceCommandAllowed(state[side], texture)) return state
  return { ...state, [side]: { ...state[side], textureSurprise: undefined } }
}

export function textureSurfaceOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!textureSelectable(state[side]) && !state[side].textureSurprise) return []
  const entries = [
    {
      action: 'texture-target' as const,
      target: 'cloth',
      fr: 'Texture Surprise · Choisir le tissu',
      en: 'Texture Surprise · Select cloth',
    },
    {
      action: 'texture-target' as const,
      target: 'gum-prostheses',
      fr: 'Texture Surprise · Choisir les prothèses',
      en: 'Texture Surprise · Select prostheses',
    },
    {
      action: 'texture-remove' as const,
      target: undefined,
      fr: 'Texture Surprise · Retirer l’apparence',
      en: 'Texture Surprise · Remove appearance',
    },
  ]
  const options = entries.map((entry) => {
    const command: ArsenalCommand = { action: entry.action, target: entry.target }
    return {
      command,
      labelFr: entry.fr,
      labelEn: entry.en,
      conditionFr:
        'Choisit un support réel pour la prochaine application. L’apparence ne régénère pas la chair et ne crée pas de membre.',
      conditionEn:
        'Selects a real support for the next application. Appearance neither regenerates flesh nor creates a limb.',
      ready: performTextureCommand(state, side, command) !== state,
    }
  })
  return [...options, ...nativeTextureOption(state, side)]
}

function nativeTextureOption(state: FightState, side: FightSide): ArsenalOption[] {
  if (state[side].id !== 'hisoka' || state[side].dolphinExecution) return []
  const move = moveById('hisoka:downSpecial')
  return [
    {
      command: { action: 'texture-apply' },
      labelFr: 'Texture Surprise · Appliquer sur le support choisi',
      labelEn: 'Texture Surprise · Apply to the selected support',
      conditionFr:
        'Exécute la technique sur le tissu ou le caoutchouc réellement présent. L’apparence ne soigne pas le corps.',
      conditionEn:
        'Executes the technique on actual cloth or rubber. The appearance does not heal the body.',
      ready: Boolean(move && canUseMovesetMove(state, side, move)),
    },
  ]
}
