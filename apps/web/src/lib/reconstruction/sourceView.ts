export type ReconstructionSourceKind = 'manga' | 'deck-plan' | 'community' | 'system' | 'unresolved'

export interface ReconstructionSourceView {
  id: string
  chapterNumber: number | null
  page: number | null
  description: string | null
  kind: ReconstructionSourceKind
  /** Internal navigation only. External scans and untrusted schemes are refused. */
  href: string | null
}

export interface ReconstructionSourceRecord {
  id: string
  chapterNumber?: number | null
  page?: number | null
  description?: string | null
}

export interface SourceProjectionOptions {
  kind?: ReconstructionSourceKind
  href?: string | null
}

export function safeInternalSourceHref(href: string | null | undefined): string | null {
  if (!href) return null
  const trimmed = href.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) return null
  if (/\p{Cc}/u.test(trimmed)) return null
  return trimmed
}

export function projectReconstructionSource(
  source: ReconstructionSourceRecord,
  options: SourceProjectionOptions = {},
): ReconstructionSourceView {
  if (!source.id.trim()) throw new Error('A reconstruction source requires an id')
  const chapterNumber = validPositiveInteger(source.chapterNumber)
  const page = validPositiveInteger(source.page)
  return {
    id: source.id.trim(),
    chapterNumber,
    page,
    description: source.description?.trim() || null,
    kind: options.kind ?? (chapterNumber === null ? 'unresolved' : 'manga'),
    href: safeInternalSourceHref(options.href),
  }
}

function validPositiveInteger(value: number | null | undefined): number | null {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : null
}
