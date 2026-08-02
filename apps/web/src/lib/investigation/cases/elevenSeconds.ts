import type { Locale } from '$lib/i18n'
import { localizedRoom1014Case } from '../localizedCase'
import { ROOM_1014_SIGHT_LINES } from '../geometry'
import { frameAt } from '../replay'
import { INVESTIGATION_SCHEMA_VERSION, type InvestigationCaseDefinition } from '../definition'

export function elevenSecondsDefinition(locale: Locale): InvestigationCaseDefinition {
  const content = localizedRoom1014Case(locale)
  return {
    schemaVersion: INVESTIGATION_SCHEMA_VERSION,
    metadata: {
      slug: 'eleven-seconds',
      requiredChapter: 370,
      investigatorId: 'kurapika',
      difficulty: 'introductory',
      estimatedMinutes: 20,
      modes: ['2d', '3d'],
      order: 1,
    },
    content,
    scene: {
      tierId: 'interior-room-1014',
      spaceId: 'tier-1-royal-residential-sector-room-1014-living',
      phenomena: ['doll', 'snakes'],
      sightLines: ROOM_1014_SIGHT_LINES,
    },
    confrontations: [
      {
        id: 'loberry-furykov-visibility',
        subjectIds: ['loberry', 'furykov'],
        requiredEvidenceIds: ['loberry-vision', 'bill-testimony'],
        evidenceIds: ['visibility-split'],
      },
      {
        id: 'bill-sakata-corroboration',
        subjectIds: ['bill', 'sakata'],
        requiredEvidenceIds: ['bill-testimony'],
        evidenceIds: [],
      },
    ],
    hatsuRules: [
      {
        id: 'dowsing-witnesses',
        kinds: ['dowsing'],
        subjectIds: ['bill', 'loberry'],
        evidenceIds: ['bill-testimony', 'loberry-vision'],
        lifeHours: 0,
        outcome: 'corroboration',
      },
      {
        id: 'emperor-time-analysis',
        kinds: ['scarlet'],
        subjectIds: ['body', 'kurapika'],
        evidenceIds: ['death-window', 'nen-residue'],
        lifeHours: 3,
        outcome: 'evidence',
      },
    ],
    replay: Array.from({ length: 12 }, (_, second) => frameAt(second)),
    report: {
      requiredHypothesisId: content.canonicalHypothesisId,
      unknowns: ['silent-majority-user', 'silent-majority-affiliation', 'silent-majority-motive'],
    },
  }
}
