import { ARCHIVE_PART_1 } from './archive-entries-1'
import { ARCHIVE_PART_2 } from './archive-entries-2'
import { ARCHIVE_PART_3 } from './archive-entries-3'
import { ARCHIVE_PART_4 } from './archive-entries-4'
import type { ArchiveLocale, NenArchiveEntry } from './archive-model'
export type { ArchiveLocale, NenArchiveEntry, NenArchiveKind } from './archive-model'
export const NEN_ARCHIVE_ENTRIES: NenArchiveEntry[] = [
  ...ARCHIVE_PART_1,
  ...ARCHIVE_PART_2,
  ...ARCHIVE_PART_3,
  ...ARCHIVE_PART_4,
]
export function archiveCopy<T>(value: Record<ArchiveLocale, T>, locale: string): T {
  return value[locale === 'fr' ? 'fr' : 'en']
}
