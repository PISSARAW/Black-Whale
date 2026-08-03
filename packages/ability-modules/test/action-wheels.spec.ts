import { describe, expect, it } from 'vitest'
import { createEmptyWorld } from '@black-whale/canon-engine'
import type { AbilityContext, NenAbilityModule } from '@black-whale/nen-engine'
import { abilityModules } from '../src/index.js'

/**
 * The wheels, counted — §8.4 of `docs/hatsu-potentiel.md`.
 *
 * A hatsu pushed to its maximum is not one gesture: Bungee Gum is not "attach",
 * it is attach *to what*, *from where*, *hidden or not*. The measurement that
 * opened §8 was that fifty-two modules declared a median of three actions and
 * two of them exposed a wheel at all; these are the guards that keep that from
 * happening again.
 *
 *   - no ability falls back to a single undifferentiated activation;
 *   - every use says where it comes from, or says what it refuses;
 *   - a hypothesis is never offered on the canon branch;
 *   - a masked (In) use declares what Gyo shows instead of nothing.
 *
 * The last one is the counter-field the Gyo toggle needs: a module that hides
 * something and never says what a Gyo observer sees leaves the toggle with
 * nothing to reveal.
 */

const CURSOR = {
  branchId: 'canon',
  ordinal: 4,
  eventId: 'event-4',
  chapterNumber: 400,
  localSequence: 2,
}

/** The minimum a use must reach: four entries, per §8.4. */
const MINIMUM_ENTRIES = 4

function contextFor(module: NenAbilityModule, actionId?: string): AbilityContext {
  const ownerId = module.manifest.ownerId || 'actor'
  const state = createEmptyWorld(CURSOR)
  state.entities[ownerId] = {
    id: ownerId,
    kind: 'CHARACTER',
    label: ownerId,
    metadata: { mentalState: 'ACTIVE' },
  }
  state.entities['someone'] = {
    id: 'someone',
    kind: 'CHARACTER',
    label: 'Someone',
    metadata: { mentalState: 'ACTIVE' },
  }
  state.abilitiesByOwner[ownerId] = [module.manifest.id]
  return {
    abilityId: module.manifest.id,
    actorId: ownerId,
    ...(actionId ? { actionId } : {}),
    targets: ['someone'],
    eventId: 'event-4',
    cursor: CURSOR,
    worldState: state,
  }
}

const modules = Object.values(abilityModules) as NenAbilityModule[]
const wheelOf = (module: NenAbilityModule) => module.getActionWheel(contextFor(module))
const labelsOf = (module: NenAbilityModule, actionId: string) =>
  module.plan(contextFor(module, actionId)).conditions.map((condition) => condition.label)

describe('roues d’action', () => {
  it.each(modules.map((module) => [module.manifest.id, module] as const))(
    '%s offers at least four uses',
    (_id, module) => {
      expect(wheelOf(module).length).toBeGreaterThanOrEqual(MINIMUM_ENTRIES)
    },
  )

  it('keeps the median at four or more across the catalogue', () => {
    const counts = modules.map((module) => wheelOf(module).length).sort((a, b) => a - b)
    expect(counts[Math.floor(counts.length / 2)]).toBeGreaterThanOrEqual(MINIMUM_ENTRIES)
  })

  it('gives every use a provenance or a stated refusal', () => {
    const undocumented = modules.flatMap((module) =>
      wheelOf(module)
        .filter((entry) => {
          const labels = labelsOf(module, entry.id)
          return !labels.some(
            (label) =>
              label.startsWith('Montré au manga') ||
              label.startsWith('Affirmé, non montré') ||
              label.startsWith('Hypothèse') ||
              entry.visibility === 'locked',
          )
        })
        .map((entry) => `${module.manifest.id}/${entry.id}`),
    )
    expect(undocumented).toEqual([])
  })

  it('never offers a hypothesis on the canon branch', () => {
    for (const module of modules) {
      for (const entry of wheelOf(module)) {
        const isHypothesis = labelsOf(module, entry.id).some((label) =>
          label.startsWith('Hypothèse'),
        )
        if (!isHypothesis) continue
        expect(entry.visibility).toBe('hidden')
        expect(module.plan(contextFor(module, entry.id)).status).toBe('LOCKED')
      }
    }
  })

  it('says what Gyo reveals of every masked use', () => {
    const silent = modules.flatMap((module) =>
      wheelOf(module)
        .filter((entry) => {
          const plan = module.plan(contextFor(module, entry.id))
          const hides = plan.projectedEffects.some((effect) => effect.masked === true)
          return hides && !plan.conditions.some((c) => c.label.startsWith('Gyo révèle'))
        })
        .map((entry) => `${module.manifest.id}/${entry.id}`),
    )
    expect(silent).toEqual([])
  })
})
