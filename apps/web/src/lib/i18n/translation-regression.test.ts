import { describe, expect, it } from 'vitest'
import { messagesFor } from '$lib/i18n'
import { localizeStrategyScenario } from '$lib/strategy/localization'
import { requireStrategyScenario } from '$lib/strategy/scenario/registry'
import { buildTurnReports } from '$lib/strategy/reports'

describe('translation regressions', () => {
  it('localizes strategy scenarios and their dynamic objectives in French', () => {
    const scenario = localizeStrategyScenario(requireStrategyScenario(), 'fr')

    expect(scenario.title).toBe('Guerre des gardes')
    expect(scenario.description).not.toMatch(/first day|factions move/i)
    expect(scenario.playableFactions[0].publicObjective.title).toBe('Identifier les menaces')
    expect(scenario.events[0].title).toBe('Alerte de sécurité')
  })

  it('keeps generated strategy reports in the requested language', () => {
    const base = {
      completedTurn: 2,
      playerOrderCount: 2,
      discoveries: 1,
      interceptions: 1,
      hostileContacts: 1,
      victoryPoints: 2,
      objectiveComplete: true,
      gameWon: false,
      gameLost: false,
      scoutedLocations: 1,
      guardedLocations: 1,
      scenarioEvent: null,
      diplomacyReports: [],
      activatedHatsu: [],
      conflictReports: [],
      aiHatsuActivations: 0,
      playerMovesBlocked: 0,
    }

    expect(buildTurnReports({ ...base, locale: 'en' }).join(' ')).toContain('Turn 2')
    expect(buildTurnReports({ ...base, locale: 'en' }).join(' ')).not.toContain('Tour 2')
    expect(buildTurnReports({ ...base, locale: 'fr' }).join(' ')).toContain('Tour 2')
    expect(buildTurnReports({ ...base, locale: 'fr' }).join(' ')).not.toContain('Turn 2')
  })

  it('provides complete localized copy for the formerly mixed screens', () => {
    expect(messagesFor('en').reconstruction.v3.title).toBe('What if one decision had changed?')
    expect(messagesFor('fr').reconstruction.v3.title).toBe('Et si une décision avait changé ?')
    expect(messagesFor('en').hunt.editor.duration).toBe('Duration')
    expect(messagesFor('fr').hunt.editor.duration).toBe('Durée')
  })
})
