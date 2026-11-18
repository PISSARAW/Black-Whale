import type { KallutoPaperState } from './kallutoPaperTypes'

export function concealPaperWords(memory?: KallutoPaperState): KallutoPaperState | undefined {
  if (!memory) return undefined
  return {
    ...memory,
    heard: undefined,
    doll: memory.doll ? { ...memory.doll, heard: undefined } : undefined,
    dolls: memory.dolls?.map((doll) => ({ ...doll, heard: undefined })),
  }
}
