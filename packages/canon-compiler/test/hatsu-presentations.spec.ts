import { describe, expect, it } from 'vitest'
import { abilityModules } from '@black-whale/ability-modules'
import { loadCatalogue } from '../src/catalogue'
import { compileAbilityPresentations } from '../src/hatsu/presentations'

describe('compiling client-safe ability presentations', () => {
  const catalogue = loadCatalogue()
  const result = compileAbilityPresentations({
    modules: abilityModules,
    catalogue,
  })

  it('records a completed canon audit for every unknown category', () => {
    const unknown = catalogue.abilities.filter(({ category }) => category === 'unknown')
    expect(unknown).toHaveLength(21)
    for (const ability of unknown) {
      expect(ability.categoryAudit, ability.id).toMatchObject({
        reviewedAt: '2026-11-13',
        conclusion: 'canon-unrevealed',
      })
    }

    const projected = new Map(result.presentations.map((item) => [item.abilityId, item.identity]))
    for (const ability of unknown) {
      expect(projected.get(ability.id)?.category, ability.id).toBe('unknown')
    }
  })

  it('projects identity from the catalogue rather than module inferences', () => {
    const catalogueById = new Map(catalogue.abilities.map((ability) => [ability.id, ability]))
    for (const presentation of result.presentations) {
      const ability = catalogueById.get(presentation.abilityId)!
      expect(presentation.identity).toMatchObject({
        name: ability.name,
        ownerId: ability.ownerId,
        category: ability.category,
      })
    }
  })

  it('projects every ability and all seventy composed view keys', () => {
    expect(result.problems).toEqual([])
    expect(result.presentations).toHaveLength(85)
    expect(new Set(result.presentations.map(({ componentKey }) => componentKey)).size).toBe(70)
    expect(result.presentations.every(({ identity }) => identity.name && identity.ownerId)).toBe(
      true,
    )
    expect(
      result.presentations.every(({ actions }) =>
        actions.every(({ entry, availability }) => availability.actionId === entry.id),
      ),
    ).toBe(true)
  })

  it('generates exhaustive French and English action and view copy', () => {
    for (const presentation of result.presentations) {
      expect(presentation.viewLabel.en, presentation.abilityId).toBeTruthy()
      expect(presentation.viewLabel.fr, presentation.abilityId).toBeTruthy()
      for (const action of presentation.actions) {
        for (const locale of ['en', 'fr'] as const) {
          expect(
            action.text[locale].label,
            `${presentation.abilityId}/${action.entry.id}/${locale}`,
          ).toBeTruthy()
          expect(action.text[locale].conditions).toHaveLength(action.plan.conditions.length)
          expect(
            action.text[locale].conditions.every((label) => label.trim().length > 0),
            `${presentation.abilityId}/${action.entry.id}/${locale}`,
          ).toBe(true)
        }
      }
    }
  })

  it('rejects a shown use whose source is still a free string', () => {
    const original = abilityModules[0]!
    const malformed = {
      ...original,
      getActionWheel: (...args: Parameters<typeof original.getActionWheel>) =>
        original
          .getActionWheel(...args)
          .map((entry, index) =>
            index === 0 ? { ...entry, source: 'ch. 1 — free text' as never } : entry,
          ),
    }
    const compiled = compileAbilityPresentations({
      modules: abilityModules.map((module) => (module === original ? malformed : module)),
      catalogue,
    })
    expect(compiled.problems).toContainEqual(expect.stringContaining('CanonSourceRef'))
  })

  it('publishes at least four module-authored uses for every ability', () => {
    for (const presentation of result.presentations) {
      expect(presentation.actions.length, presentation.abilityId).toBeGreaterThanOrEqual(4)
    }
  })

  it('keeps refusals visible and hypotheses hidden on the canon projection', () => {
    const actions = result.presentations.flatMap(({ actions }) => actions)
    expect(actions.filter(({ entry }) => entry.visibility === 'locked').length).toBeGreaterThan(0)
    expect(actions.filter(({ entry }) => entry.visibility === 'hidden').length).toBeGreaterThan(0)
    for (const action of actions.filter(({ entry }) => entry.visibility === 'locked')) {
      expect(action.entry.hint).toBeTruthy()
      expect(action.plan.status).toBe('LOCKED')
    }
  })

  it('carries cost, Gyo and provenance from module plans rather than web copy', () => {
    const conditions = result.presentations.flatMap(({ actions }) =>
      actions.flatMap(({ plan }) => plan.conditions.map(({ label }) => label)),
    )
    expect(conditions.some((label) => label.startsWith('Montré au manga'))).toBe(true)
    expect(conditions.some((label) => label.startsWith('Gyo révèle'))).toBe(true)
    expect(
      result.presentations.some(({ actions }) => actions.some(({ plan }) => Boolean(plan.cost))),
    ).toBe(true)
    const sourced = result.presentations.flatMap(({ actions }) =>
      actions.flatMap(({ entry }) => (entry.source ? [entry.source] : [])),
    )
    expect(sourced.length).toBeGreaterThan(0)
    expect(sourced.every((source) => source.label.length > 0)).toBe(true)
    expect(sourced.some((source) => source.kind === 'chapter' && source.chapter > 0)).toBe(true)
  })
})
