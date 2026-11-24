import type { Object3D } from 'three'
import { bodyguardPistolStrike } from './bodyguardFirearms'
import { luiniKnifeStrike } from './luiniKnife'
import { padailleNormalTool } from './padailleNormalTools'
import type { ArcadeFighter } from './types'

export function meleeWeaponContact(figure: Object3D, fighter: ArcadeFighter): Object3D | undefined {
  if (bodyguardPistolStrike(fighter))
    return figure
      .getObjectByName(`${fighter.id}-handgun`)
      ?.getObjectByName(`${fighter.id}-pistol-butt`)
  if (luiniKnifeStrike(fighter)) return figure.getObjectByName('luini-knife-point')
  const tool = padailleNormalTool(fighter)
  if (tool) return figure.getObjectByName(`padaille-${tool}-right-hand-contact`)
}
