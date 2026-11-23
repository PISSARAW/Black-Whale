import { withGumChannel } from './bungeeChannel'
import { newGumSource, type GumSource } from './bungeeSource'
import { equippedDolphin, loanCarrier } from './dolphinBorrowing'
import { dolphinBody } from './dolphinBodies'
import { stolenAuraActor } from './dolphinSupply'
import { personalGumBody } from './gumObjectAnchorAccess'
import { chainAbilitySealed } from './kurapika'
import { chainAbilityGroup } from './chainAbilityGroup'
import { chrolloAbilityActive } from './chrolloAbilityActive'
import { voluntaryNenAvailable } from './nenAccess'
import { gumSupportAvailable } from './hisokaSupportOrigin'
import { buildTextureMask } from './textureSurpriseMask'
import type { ArcadeFighter, FightNenZone, FightSide, FightState } from './types'

export interface TextureSurpriseState extends GumSource {
  surface: 'cloth' | 'gum-prostheses'
  supportId?: string
  /** Body memory limbs hidden from the opponent. */
  maskedLimbs?: readonly FightNenZone[]
  /** HP displayed to the opponent (lags real damage at 50%). */
  displayedHp?: number
  /** Hidden Bungee Gum prosthesis trap under a weakened limb ('hands' | 'feet'). */
  bungeeTrapLimb?: 'hands' | 'feet' | null
  /** Breaks to 0 on clean Heavy / Ko / Throw impact. */
  integrity?: number
}

declare module './types' {
  interface ArcadeFighter {
    textureTarget?: TextureSurpriseState['surface'] | 'paper'
  }
}

export function createTextureSurprise(actor: ArcadeFighter): TextureSurpriseState | undefined {
  if (actor.textureTarget === 'paper') return undefined
  const origin = actor.attack?.nenOrigin ?? newGumSource(actor)
  const mask = buildTextureMask(actor)
  if (actor.textureTarget !== 'gum-prostheses') return { surface: 'cloth', ...origin, ...mask }
  if (!textureTargetAvailable(actor)) return undefined
  return { surface: 'gum-prostheses', supportId: actor.gumProstheses!.id, ...origin, ...mask }
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
  return textureOriginAvailable(state, { actor: state[side], source })
}

/** Resolve the creator's actual body, including a stored team member, without borrowing another channel. */
export function textureOriginAvailable(
  state: FightState,
  binding: { actor: ArcadeFighter; source: GumSource },
): boolean {
  const { actor, source } = binding
  if (source.source === 'dolphin') return borrowedTextureAvailable(state, binding)
  const own = personalGumBody(actor)
  if (!voluntaryNenAvailable(own) || chainAbilitySealed(own, 'hisoka:downSpecial')) return false
  if (source.source === 'personal') return own.id === 'hisoka'
  return own.id === 'chrollo' && chrolloAbilityActive(own, 'hisoka:downSpecial')
}

function borrowedTextureAvailable(
  state: FightState,
  { actor, source }: { actor: ArcadeFighter; source: GumSource },
): boolean {
  if (!textureLenderAvailable(state, actor)) return false
  if (!voluntaryNenAvailable(stolenAuraActor(loanCarrier(actor)))) return false
  const held = equippedDolphin(actor)
  return Boolean(
    held?.used &&
    !held.returned &&
    held.source === 'hisoka' &&
    held.theftId === source.theftId &&
    chainAbilityGroup(held.moveId) === 'texture-surprise',
  )
}
function textureLenderAvailable(state: FightState, actor: ArcadeFighter): boolean {
  const lender = actor.dolphinLoan ? dolphinBody(state, actor.dolphinLoan.lender) : actor
  return Boolean(lender && lender.health > 0 && lender.kurapika?.emperorTime)
}
