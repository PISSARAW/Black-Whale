import { ON_HEALTH_PER_SECOND, ON_OATH_GRUDGE, onOf } from './onTechnique'
import type { ArcadeFighter } from './types'

type Language = 'fr' | 'en'

/** Tactical read-out while the On contract burns. */
export function onTacticalCopy(language: Language): { benefit: string; risk: string } {
  return language === 'fr'
    ? {
        benefit: 'Défense 90 % partout · coups +30 % · un coup net scelle le Hatsu adverse',
        risk: 'CONTRAT · Hatsu, Ken et Ko scellés · la garde adverse consume la rancune',
      }
    : {
        benefit: '90% defence everywhere · strikes +30% · a clean hit seals the enemy Hatsu',
        risk: 'CONTRACT · Hatsu, Ken and Ko sealed · enemy guard burns the grudge',
      }
}

/** On spends life, not aura. */
export function onFlowLabel(language: Language): string {
  const amount = ON_HEALTH_PER_SECOND.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')
  return `−${amount} ${language === 'fr' ? 'PV' : 'HP'}/S`
}

export interface GrudgeGauge {
  share: number
  ready: boolean
  burning: boolean
  sealed: boolean
  label: string
}

export function grudgeGauge(fighter: ArcadeFighter, language: Language): GrudgeGauge {
  const on = onOf(fighter)
  const burning = fighter.nen.on
  const ready = !burning && on.grudge >= ON_OATH_GRUDGE
  const sealed = on.sealFrames > 0
  const name = language === 'fr' ? 'Rancune' : 'Grudge'
  const state = burning ? 'On' : ready ? (language === 'fr' ? 'On prêt' : 'On ready') : ''
  const seal = sealed ? (language === 'fr' ? 'Hatsu scellé' : 'Hatsu sealed') : ''
  return {
    share: on.grudge / 100,
    ready,
    burning,
    sealed,
    label: [`${name} ${Math.floor(on.grudge)}`, state, seal].filter(Boolean).join(' · '),
  }
}
