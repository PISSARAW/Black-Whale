import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'
import type { InvestigationCase } from './case'
import type { ScenePhenomenon, SightLine } from './geometry'
import type { ReplayFrame } from './replay'

export const INVESTIGATION_SCHEMA_VERSION = 2

export type CaseDifficulty = 'introductory' | 'intermediate' | 'advanced'
export type InvestigationMode = '2d' | '3d'

export interface CaseMetadata {
  slug: string
  requiredChapter: number
  investigatorId: string
  difficulty: CaseDifficulty
  estimatedMinutes: number
  modes: InvestigationMode[]
  order: number
}

export interface SceneDefinition {
  tierId: string
  spaceId: string
  phenomena: ScenePhenomenon[]
  sightLines: SightLine[]
}

export interface InvestigationHatsuRule {
  id: string
  kinds: HatsuInteractionKind[]
  subjectIds: string[]
  evidenceIds: string[]
  lifeHours: number
  outcome: 'evidence' | 'corroboration' | 'limited' | 'forbidden'
}

export interface ConfrontationDefinition {
  id: string
  subjectIds: [string, string]
  requiredEvidenceIds: string[]
  evidenceIds: string[]
}

export interface ReportDefinition {
  requiredHypothesisId: string
  unknowns: string[]
}

export interface InvestigationCaseDefinition {
  schemaVersion: number
  metadata: CaseMetadata
  content: InvestigationCase
  scene: SceneDefinition
  confrontations: ConfrontationDefinition[]
  hatsuRules: InvestigationHatsuRule[]
  replay: ReplayFrame[]
  report: ReportDefinition
}
