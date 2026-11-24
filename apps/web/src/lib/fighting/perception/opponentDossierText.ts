import { KAMEO_CATALOGUE } from '../kameos/catalogue'
import type { KameoId } from '../kameos/types'
import type { FightSide, FightState } from '../types'
import type { AuraBracket, OpponentBurstView, OpponentKameoView } from './opponentHudView'
import type { ObservedCondition } from './opponentIntel'

const AURA_BRACKETS: Record<AuraBracket, [string, string]> = {
  high: ['Aura haute', 'High aura'],
  medium: ['Aura moyenne', 'Medium aura'],
  low: ['Aura basse', 'Low aura'],
}

const CONDITION_LABELS: Record<ObservedCondition, [string, string]> = {
  painPacker: ['Pain Packer', 'Pain Packer'],
  cyclotron: ['Ripper Cyclotron', 'Ripper Cyclotron'],
  seiyaku: ['Serment actif', 'Active vow'],
  tsk17: ['TSK-17', 'TSK-17'],
  emperorTime: ['Emperor Time', 'Emperor Time'],
  catsName: ['Cat’s Name', 'Cat’s Name'],
}

export interface TacticalKameoReadout {
  name: string
  status: string
  active: boolean
}

export interface BurstDossierReadout {
  text: string
  tone: 'spent' | 'zetsu' | 'tension'
}

export function auraBracketLabel(
  bracket: AuraBracket | null,
  language: 'fr' | 'en',
): string | null {
  if (!bracket) return null
  return AURA_BRACKETS[bracket][language === 'fr' ? 0 : 1]
}

export function conditionLabel(condition: ObservedCondition, language: 'fr' | 'en'): string {
  return CONDITION_LABELS[condition][language === 'fr' ? 0 : 1]
}

/**
 * Formats a rival Kameo for the tactical dossier: invisible until first summoned,
 * then shows only identity and coarse presence (never role or exact cooldown).
 */
export function tacticalKameoEntry(input: {
  state: FightState
  view: OpponentKameoView
  language: 'fr' | 'en'
  targetSide?: FightSide
}): TacticalKameoReadout | null {
  if (!input.view.visible) return null
  const slot = input.state.kameos?.[input.targetSide ?? 'opponent']
  if (!slot) return null
  const def = KAMEO_CATALOGUE[slot.fighter.id as KameoId]
  const lang = input.language === 'fr' ? 0 : 1
  if (slot.phase === 'eliminated') {
    return { name: def.name, status: ['Mort', 'Dead'][lang], active: false }
  }
  if (slot.phase !== 'reserve') {
    return { name: def.name, status: ['En scène', 'On stage'][lang], active: true }
  }
  return { name: def.name, status: ['En réserve', 'In reserve'][lang], active: false }
}

/** Formats the opponent's Burst readout for the tactical dossier, or null when unknown. */
export function burstDossierLabel(
  view: OpponentBurstView,
  language: 'fr' | 'en',
): BurstDossierReadout | null {
  const fr = language === 'fr'
  if (view.zetsuSeconds !== null) {
    return { text: `ZETSU ${view.zetsuSeconds.toFixed(1)}s`, tone: 'zetsu' }
  }
  if (view.knownSpent) {
    return { text: fr ? 'BURST DÉPENSÉ' : 'BURST SPENT', tone: 'spent' }
  }
  if (view.tensionAlert) {
    return { text: fr ? 'TENSION D’AURA' : 'AURA SURGE', tone: 'tension' }
  }
  return null
}
