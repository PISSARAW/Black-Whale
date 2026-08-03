import { applyChapterScenes } from '../scenes/apply.js'
import { CHAPTER_415 } from '../scenes/chapter-415.js'
import { CHAPTER_416 } from '../scenes/chapter-416.js'
import { run } from './run.js'

run(async (prisma) => {
  const applied = []
  for (const declaration of [CHAPTER_415, CHAPTER_416]) {
    applied.push({
      chapter: declaration.chapter,
      ...(await applyChapterScenes(prisma, declaration)),
    })
  }
  return applied
})
