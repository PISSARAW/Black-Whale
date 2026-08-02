import { describe, expect, it } from 'vitest'
import { infiltrationHatsuManifestations } from './hatsuPresentation'
import { initialInfiltrationState, type MissionSetup } from './state'

const setup: MissionSetup = {
  playerAt: { position: [0, 0], spaceId: 'entry' }, objectiveSpaceId: 'office', extractionSpaceId: 'entry',
  witnesses: [{ id: 'guard', position: [1, 0], heading: 0, spaceId: 'office', sight: 8, social: true, usesEn: false, route: ['office'] }],
}
const withEffect = (kind: string) => ({
  ...initialInfiltrationState(setup),
  hatsu: { ...initialInfiltrationState(setup).hatsu, effect: { kind, witnessId: 'guard' as const, spaceId: 'entry' } },
})

describe('Infiltration Hatsu presentation through TourScene apparitions', () => {
  it.each([
    ['forged-surface', 'paper'], ['disguise-mask', 'mark'],
    ['attached-owl', 'owl'], ['paper-network', 'paper'], ['blood-tracker', 'mark'],
    ['forced-answer', 'antenna'], ['dowsing-result', 'chain'], ['cleaned', 'hoover'],
    ['gum-anchor', 'gum'], ['borrowed-page', 'book'], ['loaned-ability', 'fish'],
  ])('projects %s as a %s apparition', (effect, kind) => {
    expect(infiltrationHatsuManifestations(withEffect(effect))[0]?.kind).toBe(kind)
  })
})
