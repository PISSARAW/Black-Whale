import type { Locale } from '$lib/i18n'
import type { CaseMetadata, InvestigationCaseDefinition } from './definition'
import { elevenSecondsDefinition } from './cases/elevenSeconds'

type CaseLoader = (locale: Locale) => InvestigationCaseDefinition

const loaders = new Map<string, CaseLoader>([['eleven-seconds', elevenSecondsDefinition]])

export function caseById(id: string, locale: Locale): InvestigationCaseDefinition | null {
  return loaders.get(id)?.(locale) ?? null
}

export function listCases(locale: Locale): CaseMetadata[] {
  return [...loaders.values()]
    .map((load) => load(locale).metadata)
    .sort((a, b) => a.order - b.order)
}

export const DEFAULT_INVESTIGATION_CASE_ID = 'eleven-seconds'
