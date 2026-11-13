import { localizedLoad } from '$lib/server/localized-load'
import { readDataFile } from '$lib/server/data-files'
import type { PageServerLoad } from './$types'

interface ChapterRecord {
  number: number
}

export const load: PageServerLoad = localizedLoad(async () => {
  const chapters = await readDataFile<ChapterRecord[]>('chapters/chapters.json')
  const numbers = chapters.map((chapter) => chapter.number)
  return {
    coverage: { first: Math.min(...numbers), last: Math.max(...numbers) },
    modifiedAt: '2026-11-13',
  }
})
