import { withGumChannel } from './bungeeChannel'
import { newGumSource, type GumSource } from './bungeeSource'
import { equippedDolphin, dolphinLoanActive } from './dolphinBorrowing'
import { chainAbilityGroup } from './chainAbilityGroup'
import { chrolloAbilityActive } from './chrolloAbilityActive'
import { voluntaryNenAvailable } from './nenAccess'
import { gumSupportAvailable } from './hisokaSupportOrigin'
import type { ArcadeFighter, FightSide, FightState } from './types'

export interface TextureSurpriseState extends GumSource {
  surface: 'cloth' | 'gum-prostheses'
  supportId?: string
}

declare module './types' {
  interface ArcadeFighter {
    textureTarget?: TextureSurpriseState['surface']
  }
}

export function createTextureSurprise(actor: ArcadeFighter): TextureSurpriseState | undefined {
  const origin = actor.attack?.nenOrigin ?? newGumSource(actor)
  if (actor.textureTarget !== 'gum-prostheses') return { surface: 'cloth', ...origin }
  if (!textureTargetAvailable(actor)) return undefined
  return { surface: 'gum-prostheses', supportId: actor.gumProstheses!.id, ...origin }
}

export function textureTargetAvailable(actor: ArcadeFighter): boolean {
  if (actor.textureTarget !== 'gum-prostheses') return true
  return Boolean(
    actor.gumProstheses?.parts.length && gumSupportAvailable(actor, actor.gumProstheses),
  )
}

function textureMaterialValid(actor: ArcadeFighter, texture: TextureSurpriseState): boolean {
  if (texture.surface === 'cloth') return true
  return Boolean(
    actor.gumProstheses?.id === texture.supportId &&
    gumSupportAvailable(actor, actor.gumProstheses),
  )
}

/** The visible cloth keeps the channel which created it, independently of the current attack. */
export function maintainTextureSurprise(state: FightState, side: FightSide): FightState {
  const texture = state[side].textureSurprise
  if (!texture) return state
  if (state.pvpSeat && !texture.source) return state
  const source = texture.source ? texture : newGumSource(state[side])
  return withGumChannel(state, { ...source, side }, (scoped) =>
    textureSourceValid(scoped, side, source) && textureMaterialValid(scoped[side], texture)
      ? scoped
      : { ...scoped, [side]: { ...scoped[side], textureSurprise: undefined } },
  )
}
function textureSourceValid(state: FightState, side: FightSide, source: GumSource): boolean {
  const actor = state[side]
  if (!voluntaryNenAvailable(actor)) return false
  if (source.source !== 'dolphin') return chrolloAbilityActive(actor, 'hisoka:downSpecial')
  return borrowedTextureValid(state, side, source)
}
function borrowedTextureValid(state: FightState, side: FightSide, source: GumSource): boolean {
  const actor = state[side]
  if (!textureLenderAvailable(state, side)) return false
  const held = equippedDolphin(actor)
  return Boolean(
    held?.used &&
    !held.returned &&
    held.source === 'hisoka' &&
    held.theftId === source.theftId &&
    chainAbilityGroup(held.moveId) === 'texture-surprise',
  )
}
function textureLenderAvailable(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  return actor.dolphinLoan ? dolphinLoanActive(state, side) : Boolean(actor.kurapika?.emperorTime)
}
