import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'
import type { InvestigationCase } from './case'
import type { ScenePhenomenon, SightLine } from './geometry'
import type { ReplayFrame } from './replay'

export const INVESTIGATION_SCHEMA_VERSION = 3

export type CaseDifficulty = 'introductory' | 'intermediate' | 'advanced'
export type InvestigationMode = '2d' | '3d'

export interface CaseMetadata {
  slug: string
  title: string
  teaser: string
  location: string
  investigator: string
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
  /** What the cross-examination yields: a new deduction, or two accounts that agree. */
  tone: 'deduction' | 'corroboration'
  title: string
  finding: string
  /** Said when the declarations to compare have not been gathered yet. */
  incompleteFinding: string
}

export interface ReportDefinition {
  requiredHypothesisId: string
  /** The closing line of the report: what is established, and what is not. */
  disposition: string
  /** The reconstruction retained, step by step. */
  mechanism: string[]
  /** What the case cannot answer, said plainly. */
  unknowns: string[]
}

export interface ConclusionOption {
  id: string
  label: string
  hypothesisIds: string[]
}

export interface ConclusionDimension {
  id: string
  label: string
  options: ConclusionOption[]
}

export interface ConclusionDefinition {
  dimensions: ConclusionDimension[]
}

export interface InvestigationCaseDefinition {
  schemaVersion: number
  metadata: CaseMetadata
  content: InvestigationCase
  scene: SceneDefinition
  confrontations: ConfrontationDefinition[]
  conclusion: ConclusionDefinition
  hatsuRules: InvestigationHatsuRule[]
  replay: ReplayFrame[]
  report: ReportDefinition
}
