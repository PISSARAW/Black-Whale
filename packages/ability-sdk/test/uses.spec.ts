import { describe, expect, it } from 'vitest'
import type { AbilityContext } from '@black-whale/nen-engine'
import { createEmptyWorld, type StoryCursor, type WorldState } from '@black-whale/canon-engine'
import {
  asserted,
  defineAbility,
  elasticConnection,
  hypothesis,
  masked,
  shown,
} from '../src/index.js'

/**
 * The grammar of uses (§8 of `docs/hatsu-potentiel.md`).
 *
 * A wheel full of entries is only worth something if each one says where it
 * comes from. These are the three truths — shown, asserted, hypothesis — plus
 * the fourth thing a grid must be able to say: what the ability refuses.
 */

const CURSOR: StoryCursor = {
  branchId: 'canon',
  eventId: 'event-1',
  chapterNumber: 401,
  localSequence: 1,
  ordinal: 1,
}

function world(): WorldState {
  const state = createEmptyWorld(CURSOR)
  state.entities['hisoka'] = {
    id: 'hisoka',
    kind: 'CHARACTER',
    label: 'Hisoka',
    metadata: { mentalState: 'ACTIVE' },
  }
  state.abilitiesByOwner['hisoka'] = ['bungee-gum']
  return state
}

const ability = defineAbility({
  id: 'bungee-gum',
  owner: 'hisoka',
  actions: {
    attach: {
      label: 'Attacher',
      evidence: shown('ch. 39'),
      effects: [elasticConnection()],
    },
    'set-trap': {
      label: 'Poser un piège (In)',
      evidence: shown('ch. 359'),
      gyo: 'le filament tendu en travers du couloir',
      effects: [masked(elasticConnection())],
    },
    'wall-run': {
      label: 'Courir sur les murs',
      evidence: asserted('description du catalogue'),
      effects: [elasticConnection()],
    },
    'ko-strike': {
      label: 'Frappe en Ko',
      evidence: hypothesis('Bungee Gum concentré en Ko'),
      effects: [elasticConnection()],
    },
    'bind-own-aura': {
      label: 'Attacher son propre Nen à un autre Nen',
      refusal: 'Bungee Gum ne prend pas sur l’aura d’autrui',
    },
  },
})

function context(actionId: string): AbilityContext {
  return {
    abilityId: 'bungee-gum',
    actorId: 'hisoka',
    actionId,
    targets: ['gon'],
    eventId: 'event-1',
    cursor: CURSOR,
    worldState: world(),
  }
}

const wheel = () => ability.getActionWheel(context('attach'))
const entry = (id: string) => wheel().find((item) => item.id === id)

describe('grammaire d’emploi', () => {
  it('shows the source of a use the manga draws', () => {
    const conditions = ability.plan(context('attach')).conditions
    expect(conditions).toContainEqual(
      expect.objectContaining({ label: 'Montré au manga — ch. 39', status: 'MET' }),
    )
    expect(entry('attach')?.visibility).toBe('available')
  })

  it('marks a use that is only asserted, without blocking it', () => {
    expect(ability.plan(context('wall-run')).status).toBe('AVAILABLE')
    expect(entry('wall-run')?.hint).toContain('Affirmé, non montré')
  })

  it('keeps a hypothesis out of the canon wheel and refuses to run it there', () => {
    expect(entry('ko-strike')?.visibility).toBe('hidden')
    expect(ability.plan(context('ko-strike')).status).toBe('LOCKED')
    expect(ability.execute(context('ko-strike')).allowed).toBe(false)
  })

  it('opens the same hypothesis in a simulation branch', () => {
    const ctx = context('ko-strike')
    const branched = { ...ctx, cursor: { ...CURSOR, branchId: 'what-if-1' } }
    expect(ability.plan(branched).status).toBe('AVAILABLE')
  })

  it('greys a canon refusal instead of dropping it, and refuses to run it', () => {
    expect(entry('bind-own-aura')?.visibility).toBe('locked')
    expect(entry('bind-own-aura')?.hint).toContain('ne prend pas')
    expect(ability.execute(context('bind-own-aura')).allowed).toBe(false)
  })

  it('states what Gyo reveals of a masked use', () => {
    const explained = ability.explainAction('set-trap', context('set-trap'))
    expect(explained.conditions).toContainEqual(
      expect.objectContaining({ label: expect.stringContaining('Gyo révèle') }),
    )
  })
})
