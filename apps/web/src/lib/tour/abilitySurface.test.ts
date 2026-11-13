import { describe, expect, it, vi } from 'vitest'
import { presentationFor } from '$lib/nen/abilityPresentation'
import { hatsuById } from '$lib/nen/hatsuRegistry'
import { reachBody, type Reach, type ReachInput } from './cast/reach'
import type { CastDossier } from './cast/dossier'
import type { CastMember, Post } from './cast/types'
import {
  tourAbilitySurfaceAdapter,
  tourActionAvailability,
  tourCommandFor,
  tourSupportsAbility,
} from './abilitySurface'

const reasons = {
  unsupported: 'unsupported',
  targetRequired: 'target required',
  inRequired: 'In required',
  nothingHeld: 'nothing held',
}

const ROOM = 'tier-1-royal-residential-sector-room-1014'

function body(
  nen: CastMember['nen'] = {
    techniques: [],
    awakenedFromChapter: null,
    conduct: { mode: 'ten', concealedWithIn: false, enRadius: null },
  },
): Post {
  return {
    member: {
      characterId: 'target',
      name: 'Target',
      locations: [ROOM],
      role: 'Royal Bodyguard',
      since: 'ch-358',
      nen,
      hatsu: [],
      beast: null,
    },
    spaceId: ROOM,
    tierId: 'tier-1',
    at: [0, 0],
    costume: { role: 'guard' },
  }
}

const dossier = (patch: Partial<CastDossier> = {}): CastDossier => ({
  characterId: 'target',
  role: 'Royal Bodyguard',
  faction: null,
  factionId: null,
  category: null,
  techniques: [],
  route: [],
  withheld: 0,
  sealed: null,
  ...patch,
})

function bodyInput(abilityId: string, patch: Partial<ReachInput> = {}): ReachInput {
  const profile = hatsuById(abilityId)
  if (!profile) throw new Error(`No Hatsu profile for ${abilityId}`)
  return {
    kind: profile.kind,
    target: body(),
    dossier: dossier(),
    aura: 'ten',
    book: null,
    speaking: false,
    throughMatter: true,
    decipherDays: 0,
    now: 1_000_000,
    ...patch,
  }
}

/**
 * The same vertical seam as the page: the selected module action is accepted
 * by the surface adapter, then the existing body reducer decides its result.
 * Refusals are previewed first, so the wheel can explain them without ever
 * executing the forbidden action.
 */
function bodyJourney(abilityId: string, actionId: string, patch: Partial<ReachInput> = {}) {
  const presentation = presentationFor(abilityId)!
  const input = bodyInput(abilityId, patch)
  const preview = reachBody(input)
  let result: Reach | null = null
  const execute = vi.fn(() => {
    result = reachBody(input)
  })
  const adapter = tourAbilitySurfaceAdapter({
    presentation,
    name: presentation.identity.name,
    owner: presentation.identity.ownerId,
    reducedMotion: false,
    targetId: input.target!.member.characterId,
    bodyTargetId: input.target!.member.characterId,
    bodyRefusal: preview.outcome === 'refused' ? preview.reason : null,
    concealed: false,
    bodyHolds: 0,
    worldHolds: 0,
    reasons,
    execute,
  })
  adapter.dispatch(actionId)
  return { adapter, execute, preview, result }
}

describe('the tour ability surface', () => {
  it('routes all eight families to the existing ship and body reducers', () => {
    expect(tourCommandFor('bungee-gum', 'attach')).toBe('cast-primary')
    expect(tourCommandFor('bungee-gum', 'release')).toBe('release-world')
    expect(tourCommandFor('illumi-needle-people', 'plant-needle')).toBe('cast-body')
    expect(tourCommandFor('illumi-needle-people', 'remove-needle')).toBe('release-bodies')
    expect(tourCommandFor('theta-aura-projectile', 'test')).toBe('cast-body')
    expect(tourCommandFor('yomotsu-hegui', 'consummate')).toBe('cast-body')
    expect(tourCommandFor('body-and-soul', 'interrogate')).toBe('cast-body')
    expect(tourCommandFor('damage-sweet-home', 'link')).toBe('cast-body')
    expect(tourCommandFor('stand-by-me', 'lend')).toBe('cast-body')
    expect(tourCommandFor('bohemian-rhapsody', 'merge')).toBe('cast-body')
    expect(tourCommandFor('bungee-gum', 'program-post-mortem')).toBeNull()
    expect(tourSupportsAbility('stand-by-me')).toBe(true)
    expect(tourSupportsAbility('contagion')).toBe(false)
  })

  it('keeps a non-representable use visible but inexecutable', () => {
    const presentation = presentationFor('bungee-gum')!
    expect(
      tourActionAvailability(
        {
          presentation,
          targetId: 'target',
          bodyTargetId: 'target',
          bodyRefusal: null,
          concealed: false,
          bodyHolds: 0,
          worldHolds: 0,
          reasons,
        },
        'program-post-mortem',
      ),
    ).toEqual({ executable: false, reason: 'unsupported' })
  })

  it('requires a body for Needle People and In for a concealed trap', () => {
    const needle = presentationFor('illumi-needle-people')!
    const gum = presentationFor('bungee-gum')!
    const state = {
      targetId: null,
      bodyTargetId: null,
      bodyRefusal: null,
      concealed: false,
      bodyHolds: 0,
      worldHolds: 0,
      reasons,
    }
    expect(tourActionAvailability({ ...state, presentation: needle }, 'plant-needle')).toEqual({
      executable: false,
      reason: 'target required',
    })
    expect(tourActionAvailability({ ...state, presentation: gum }, 'set-trap')).toEqual({
      executable: false,
      reason: 'In required',
    })
  })

  it('builds a live view model and dispatches only executable actions', () => {
    const presentation = presentationFor('bungee-gum')!
    const execute = vi.fn()
    const adapter = tourAbilitySurfaceAdapter({
      presentation,
      name: 'Bungee Gum',
      owner: 'Hisoka',
      reducedMotion: false,
      targetId: 'body-hisoka',
      bodyTargetId: 'body-hisoka',
      bodyRefusal: null,
      concealed: true,
      bodyHolds: 1,
      worldHolds: 2,
      reasons,
      execute,
    })
    const model = adapter.modelFor(presentation, 'attach')!
    expect(model.preview).toBe(false)
    expect(model.targets).toEqual(['body-hisoka'])
    expect(model.metrics).toMatchObject({ bodyHolds: 1, worldHolds: 2, concealed: true })
    adapter.dispatch('attach')
    adapter.dispatch('program-post-mortem')
    expect(execute).toHaveBeenCalledOnce()
    expect(execute).toHaveBeenCalledWith('cast-primary')
    expect(adapter.supports?.('attach')).toBe(true)
    expect(adapter.supports?.('program-post-mortem')).toBe(false)
  })

  it('does not mistake a room target for a person required by a body action', () => {
    const presentation = presentationFor('stand-by-me')!
    expect(
      tourActionAvailability(
        {
          presentation,
          targetId: 'tier-1-room-1001',
          bodyTargetId: null,
          bodyRefusal: null,
          concealed: false,
          bodyHolds: 0,
          worldHolds: 0,
          reasons,
        },
        'lend',
      ),
    ).toEqual({ executable: false, reason: 'target required' })
  })

  it('publishes a canon body refusal before dispatching the action', () => {
    const presentation = presentationFor('bohemian-rhapsody')!
    expect(
      tourActionAvailability(
        {
          presentation,
          targetId: 'prince-zhang-lei',
          bodyTargetId: 'prince-zhang-lei',
          bodyRefusal: 'Benjamin is alive',
          concealed: false,
          bodyHolds: 0,
          worldHolds: 0,
          reasons,
        },
        'merge',
      ),
    ).toEqual({ executable: false, reason: 'Benjamin is alive' })
  })

  describe('complete body-family journeys', () => {
    it('shows Needle People resistance and never executes through raised Ren', () => {
      const journey = bodyJourney('illumi-needle-people', 'plant-needle', { aura: 'ren' })
      expect(journey.preview).toMatchObject({ outcome: 'refused', reason: 'resisted' })
      expect(journey.adapter.availability?.('plant-needle')).toEqual({
        executable: false,
        reason: 'resisted',
      })
      expect(journey.execute).not.toHaveBeenCalled()
      expect(journey.result).toBeNull()
    })

    it('fires Theta’s test and reports a Zetsu that held', () => {
      const journey = bodyJourney('theta-aura-projectile', 'test', { aura: 'zetsu' })
      expect(journey.execute).toHaveBeenCalledWith('cast-body')
      expect(journey.result).toMatchObject({ outcome: 'told', tells: ['holds-zetsu'] })
    })

    it('keeps Yomotsu Hegui’s suicidal rite visible but inexecutable', () => {
      const journey = bodyJourney('yomotsu-hegui', 'consummate')
      expect(journey.preview).toMatchObject({ outcome: 'refused', reason: 'suicide' })
      expect(journey.adapter.availability?.('consummate')).toEqual({
        executable: false,
        reason: 'suicide',
      })
      expect(journey.execute).not.toHaveBeenCalled()
    })

    it('lets Body and Soul reveal only the sealed dossier fields', () => {
      const journey = bodyJourney('body-and-soul', 'interrogate', {
        dossier: dossier({ sealed: { allegiance: 'Heil-Ly', identity: null } }),
      })
      expect(journey.result).toMatchObject({ outcome: 'told', tells: ['unsealed'] })
    })

    it('lays Damage: Sweet Home’s link on the selected body', () => {
      const journey = bodyJourney('damage-sweet-home', 'link')
      expect(journey.result).toMatchObject({
        outcome: 'held',
        characterId: 'target',
        hold: { mark: 'linked' },
      })
    })

    it('lends Stand By Me only to Benjamin’s allied soldier', () => {
      const allied = bodyJourney('stand-by-me', 'lend', {
        dossier: dossier({ factionId: 'prince-benjamin' }),
      })
      expect(allied.result).toMatchObject({ outcome: 'held', hold: { mark: 'linked' } })

      const outsider = bodyJourney('stand-by-me', 'lend', {
        dossier: dossier({ factionId: 'prince-woble' }),
      })
      expect(outsider.preview).toMatchObject({ outcome: 'refused', reason: 'allied-soldier' })
      expect(outsider.execute).not.toHaveBeenCalled()
    })

    it('explains why Bohemian Rhapsody cannot transfer before Benjamin’s death', () => {
      const journey = bodyJourney('bohemian-rhapsody', 'merge')
      expect(journey.preview).toMatchObject({ outcome: 'refused', reason: 'benjamin-alive' })
      expect(journey.adapter.availability?.('merge')).toEqual({
        executable: false,
        reason: 'benjamin-alive',
      })
      expect(journey.execute).not.toHaveBeenCalled()
    })
  })
})
