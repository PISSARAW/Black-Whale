export const INVESTIGATION_PROGRESS_VERSION = 2
export const INVESTIGATION_STORAGE_KEY = 'black-whale:investigation:room-1014'

export interface InvestigationLogEntry {
  id: string
  kind: 'DISCOVERY' | 'HYPOTHESIS' | 'VERDICT' | 'HATSU'
  label: string
}

export interface InvestigationProgress {
  version: number
  caseId: string
  started: boolean
  discoveredIds: string[]
  selectedEvidenceIds: string[]
  selectedHypothesisId: string | null
  solved: boolean
  hatsuUseKeys: string[]
  log: InvestigationLogEntry[]
}

export function freshProgress(caseId: string): InvestigationProgress {
  return {
    version: INVESTIGATION_PROGRESS_VERSION,
    caseId,
    started: false,
    discoveredIds: [],
    selectedEvidenceIds: [],
    selectedHypothesisId: null,
    solved: false,
    hatsuUseKeys: [],
    log: [],
  }
}

export function parseProgress(raw: string | null, caseId: string): InvestigationProgress {
  if (!raw) return freshProgress(caseId)

  try {
    const value = JSON.parse(raw) as Partial<InvestigationProgress>
    if (value.version !== INVESTIGATION_PROGRESS_VERSION || value.caseId !== caseId) {
      return freshProgress(caseId)
    }

    return {
      version: INVESTIGATION_PROGRESS_VERSION,
      caseId,
      started: value.started === true,
      discoveredIds: stringArray(value.discoveredIds),
      selectedEvidenceIds: stringArray(value.selectedEvidenceIds),
      selectedHypothesisId:
        typeof value.selectedHypothesisId === 'string' ? value.selectedHypothesisId : null,
      solved: value.solved === true,
      hatsuUseKeys: stringArray(value.hatsuUseKeys),
      log: Array.isArray(value.log) ? value.log.filter(isLogEntry).slice(-30) : [],
    }
  } catch {
    return freshProgress(caseId)
  }
}

export function serializeProgress(progress: InvestigationProgress): string {
  return JSON.stringify(progress)
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === 'string'))]
    : []
}

function isLogEntry(value: unknown): value is InvestigationLogEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<InvestigationLogEntry>
  return (
    typeof entry.id === 'string' &&
    typeof entry.label === 'string' &&
    (entry.kind === 'DISCOVERY' ||
      entry.kind === 'HYPOTHESIS' ||
      entry.kind === 'VERDICT' ||
      entry.kind === 'HATSU')
  )
}
