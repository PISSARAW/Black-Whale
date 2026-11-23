import { bodyMemoryWeak } from './bodyMemory'
import type { TextureSurpriseState } from './hisokaTextureOrigin'
import type { ArcadeFighter, AttackKind, AttackVariant, FightNenZone } from './types'

export const TEXTURE_SURPRISE_COST = 12
export const TEXTURE_MASK_UPKEEP = 1
export const TEXTURE_TRAP_STUN = 18

export interface TextureHitInput {
  fighter: ArcadeFighter
  attacker: ArcadeFighter
  damage: number
  blocked: boolean
  zone?: FightNenZone
  kind?: AttackKind
  variant?: AttackVariant
}

export interface TextureHitResult {
  textureSurprise: TextureSurpriseState | undefined
  trapped: boolean
}

export interface TextureSurprisePov {
  maskActive: boolean
  displayedHp: number
  realHp: number
  showGhostHp: boolean
  maskBodyMemory: boolean
  maskWounds: boolean
  auraSeeping: boolean
}

/** Captures weakened limbs and starting HP when Hisoka applies Texture Surprise. */
export function buildTextureMask(
  actor: ArcadeFighter,
): Pick<TextureSurpriseState, 'maskedLimbs' | 'displayedHp' | 'bungeeTrapLimb' | 'integrity'> {
  const maskedLimbs: FightNenZone[] = []
  if (bodyMemoryWeak(actor, 'hands')) maskedLimbs.push('hands')
  if (bodyMemoryWeak(actor, 'feet')) maskedLimbs.push('feet')
  const bungeeTrapLimb = maskedLimbs.includes('hands')
    ? 'hands'
    : maskedLimbs.includes('feet')
      ? 'feet'
      : null
  return {
    maskedLimbs,
    displayedHp: actor.health,
    bungeeTrapLimb,
    integrity: 1,
  }
}

/** 0/s normally; -1 aura/s when Bungee Gum holds a weakened Body Memory limb underneath. */
export function textureSurpriseDrain(fighter: ArcadeFighter): number {
  return (fighter.textureSurprise?.maskedLimbs?.length ?? 0) > 0 ? TEXTURE_MASK_UPKEEP : 0
}

function isHeavyBreak(input: TextureHitInput): boolean {
  if (input.blocked) return false
  return input.kind === 'heavy' || input.variant === 'throw' || Boolean(input.attacker.nen.ko)
}

/**
 * Updates Texture Surprise on contact:
 * - Clean hit on a hidden Bungee Gum trap limb tears the texture AND traps the attacker.
 * - Clean Heavy / Ko / Throw physically rips the texture (instant HUD snap).
 * - Light / ranged / blocked hits keep the mask and smooth displayedHp at 50% of real damage.
 */
export function updateTextureOnHit(input: TextureHitInput): TextureHitResult {
  const texture = input.fighter.textureSurprise
  if (!texture) return { textureSurprise: undefined, trapped: false }
  const trapped = Boolean(
    !input.blocked &&
    input.damage > 0 &&
    texture.bungeeTrapLimb &&
    input.zone === texture.bungeeTrapLimb,
  )
  if (trapped || isHeavyBreak(input)) {
    return { textureSurprise: undefined, trapped }
  }
  const previousDisplayed = texture.displayedHp ?? input.fighter.health
  const displayedHp = Math.max(0, previousDisplayed - input.damage * 0.5)
  return {
    textureSurprise: { ...texture, displayedHp },
    trapped: false,
  }
}

/** Computes the asymmetric POV view for the HUD (owner sees truth; opponent sees the mask + Gyo cues). */
export function textureSurpriseView(
  target: ArcadeFighter,
  observer: ArcadeFighter,
  perspective: 'owner' | 'opponent',
): TextureSurprisePov {
  const texture = target.textureSurprise
  const active = Boolean(texture && !target.auraExhausted && target.nen.mode !== 'zetsu')
  if (!active || perspective === 'owner') {
    return {
      maskActive: active,
      displayedHp: target.health,
      realHp: target.health,
      showGhostHp: false,
      maskBodyMemory: false,
      maskWounds: false,
      auraSeeping: false,
    }
  }
  const fullGyo = Boolean(observer.nen.gyo && !observer.gyoLow)
  return {
    maskActive: true,
    displayedHp: texture!.displayedHp ?? target.health,
    realHp: target.health,
    showGhostHp: fullGyo,
    maskBodyMemory: true,
    maskWounds: true,
    auraSeeping: fullGyo,
  }
}
