import { DOWSING_TEXT_LENGTH } from './dowsingTypes'
import { judgmentTargetLimit } from './judgmentInquiryTypes'
import { DOCUMENT_TEXT_LENGTH } from './paperDocumentTypes'

/** Transport bounds cover the editor text plus its command prefix. */
export function arsenalCommandTargetLimit(action: string): number {
  if (action === 'texture-paper-text') return DOCUMENT_TEXT_LENGTH
  if (action.startsWith('document-') || action.startsWith('texture-paper')) return 192
  if (action === 'dowsing-ask') return DOWSING_TEXT_LENGTH + 'question:'.length
  if (action === 'dowsing-answer') return DOWSING_TEXT_LENGTH + 'truth:'.length
  return judgmentTargetLimit(action)
}
