import { applyOcularInput } from './nenCombat/ocularInput'
import { clearBodyGyo, focusBodyGyo } from './nenCombat/bodyGyo'
import { enRadius, ARCADE_EN_RADIUS } from './en/profiles'
import { activeEnRadius, canMaintainEn } from './en/access'
import { voluntaryNenAvailable } from './nenAccess'
import { transitionNen, type NenTechniqueAction } from '@black-whale/nen-engine'
import type { ArcadeFighter, FightInput, FightNenZone } from './types'

/** Duel distances/maintenance costs are tuning, not claims about manga measurements. */
/** Legacy arcade constant, never a character range or proof of learned En. */
export const EN_RADIUS = ARCADE_EN_RADIUS
export const EN_DRAIN = 9
export const SHU_DRAIN = 4
export const IN_DRAIN = 3
export const SHU_BODY_SHARE = 0.8

const WEAPONS: Readonly<Partial<Record<ArcadeFighter['id'], string>>> = {
  kurapika: 'chains',
  hisoka: 'cards',
  feitan: 'umbrella',
  saiyu: 'staff',
  shizuku: 'blinky',
  illumi: 'needles',
  kalluto: 'paper',
}

export function shuObject(fighter: ArcadeFighter): string {
  return WEAPONS[fighter.id] ?? 'stone'
}

export function conjuredWeapon(fighter: ArcadeFighter): boolean {
  return ['kurapika', 'shizuku', 'saiyu'].includes(fighter.id)
}

export function weaponUsesShu(fighter: ArcadeFighter): boolean {
  return Boolean(WEAPONS[fighter.id] && fighter.nen.shu.includes(shuObject(fighter)))
}

export function selectedNenZone(input: FightInput): FightNenZone | null {
  if (input.focusHead) return 'head'
  if (input.focusTorso) return 'torso'
  if (input.focusHands) return 'hands'
  return input.focusFeet ? 'feet' : null
}

function action(fighter: ArcadeFighter, value: NenTechniqueAction<FightNenZone>): ArcadeFighter {
  return { ...fighter, nen: transitionNen(fighter.nen, value).state }
}

/** Held overlays never survive releasing their input, Zetsu, exhaustion or an impact. */
export function applyAdvancedNen(fighter: ArcadeFighter, input: FightInput): ArcadeFighter {
  fighter = clearBodyGyo(fighter)
  const available = advancedNenAvailable(fighter)
  const en = available && Boolean(input.en) && canMaintainEn(fighter, input)
  const shu = available && Boolean(input.shu)
  if (fighter.nen.ko) {
    const overlaid = action(fighter, { type: 'SHU', objectId: shuObject(fighter), on: shu })
    return applySightInputs(overlaid, input, available)
  }
  let next = action(fighter, { type: 'EN', radius: en ? enRadius(fighter) : null })
  next = action(next, { type: 'SHU', objectId: shuObject(fighter), on: shu })
  next = applySightInputs(next, input, available)
  if (en) next = { ...next, nen: { ...next.nen, mode: 'ren', ken: false, ko: null, ryu: {} } }
  return applyManualFocus(next, input, available && !en)
}

function applyManualFocus(
  fighter: ArcadeFighter,
  input: FightInput,
  available: boolean,
): ArcadeFighter {
  const zone = selectedNenZone(input)
  if (!available || !zone) return fighter
  return input.gyo && !input.aura ? focusBodyGyo(fighter, zone) : focusNenZone(fighter, zone)
}

function applySightInputs(
  fighter: ArcadeFighter,
  input: FightInput,
  available: boolean,
): ArcadeFighter {
  let next = applyOcularInput(fighter, input, available)
  if (input.conceal || fighter.nen.in)
    next = action(next, {
      type: 'IN',
      on: available && Boolean(input.conceal || fighter.attack?.concealed),
    })
  return next
}

function advancedNenAvailable(fighter: ArcadeFighter): boolean {
  return (
    voluntaryNenAvailable(fighter, { requireHatsu: false, requireReserve: true }) &&
    fighter.hitStun === 0 &&
    fighter.knockdownFrames === 0
  )
}

export function focusNenZone(fighter: ArcadeFighter, zone: FightNenZone): ArcadeFighter {
  if (!canRedistributeAura(fighter)) return fighter
  const distribution = { head: 8, torso: 8, hands: 8, feet: 8, [zone]: 76 }
  return {
    ...action(
      { ...fighter, nen: { ...fighter.nen, mode: 'ren', ken: false } },
      { type: 'RYU', distribution },
    ),
    ryuWindow: 9,
  }
}

export function canRedistributeAura(fighter: ArcadeFighter): boolean {
  return voluntaryNenAvailable(fighter, { requireHatsu: false })
}

export function advancedAuraDrain(fighter: ArcadeFighter): number {
  return (
    Number(Boolean(activeEnRadius(fighter))) * EN_DRAIN +
    Number(fighter.nen.shu.length > 0) * SHU_DRAIN +
    Number(fighter.nen.in) * IN_DRAIN
  )
}
