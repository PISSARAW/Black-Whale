import { writeFile } from 'node:fs/promises'
import { FRAME_DATA_FILE, frameDataMarkdown } from '../apps/web/src/lib/fighting/frameDataTable'

await writeFile(FRAME_DATA_FILE, frameDataMarkdown())
console.log(`Wrote ${FRAME_DATA_FILE}`)
