import { describe, expect, it } from 'vitest'
import { createFightState } from '../fightState'
import { withKameos } from '../kameos/state'
import {
  auraBracketLabel,
  burstDossierLabel,
  conditionLabel,
  tacticalKameoEntry,
} from './opponentDossierText'

describe('opponentDossierText', () => {
  it('formats aura brackets and observed conditions in FR and EN', () => {
    expect(auraBracketLabel(null, 'fr')).toBeNull()
    expect(auraBracketLabel('high', 'fr')).toBe('Aura haute')
    expect(auraBracketLabel('low', 'en')).toBe('Low aura')
    expect(conditionLabel('seiyaku', 'fr')).toBe('Serment actif')
    expect(conditionLabel('emperorTime', 'en')).toBe('Emperor Time')
  })

  it('hides opponent Kameo until revealed and strips role & cooldown afterwards', () => {
    const base = createFightState('kurapika', 'hisoka')
    const state = withKameos(base, { opponent: 'tubeppa' })
    state.kameos!.opponent!.cooldownFrames = 240

    expect(
      tacticalKameoEntry(state, { visible: false, showCooldown: false, showRole: false }, 'fr'),
    ).toBeNull()

    const revealed = tacticalKameoEntry(
      state,
      { visible: true, showCooldown: false, showRole: false },
      'fr',
    )
    expect(revealed).not.toBeNull()
    expect(revealed?.status).toBe('En réserve')
    expect(revealed?.status).not.toContain('4')
  })

  it('formats Burst dossier cues without leaking unused availability at level 0', () => {
    expect(
      burstDossierLabel(
        { level: 0, knownSpent: false, exactAvailable: null, zetsuSeconds: null, tensionAlert: false },
        'fr',
      ),
    ).toBeNull()

    expect(
      burstDossierLabel(
        { level: 1, knownSpent: true, exactAvailable: null, zetsuSeconds: null, tensionAlert: false },
        'fr',
      ),
    ).toEqual({ text: 'BURST DÉPENSÉ', tone: 'spent' })

    expect(
      burstDossierLabel(
        { level: 2, knownSpent: false, exactAvailable: null, zetsuSeconds: null, tensionAlert: true },
        'fr',
      ),
    ).toEqual({ text: 'TENSION D’AURA', tone: 'tension' })

    expect(
      burstDossierLabel(
        { level: 2, knownSpent: true, exactAvailable: null, zetsuSeconds: 1.5, tensionAlert: false },
        'en',
      ),
    ).toEqual({ text: 'ZETSU 1.5s', tone: 'zetsu' })
  })
})
