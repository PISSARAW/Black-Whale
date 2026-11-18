import { DOWSING_TEXT_LENGTH } from './dowsingTypes'
import { judgmentTargetLimit } from './judgmentInquiryTypes'

/** Transport bounds cover the editor text plus its command prefix. */
export function arsenalCommandTargetLimit(action: string): number {
  if (action === 'dowsing-ask') return DOWSING_TEXT_LENGTH + 'question:'.length
  if (action === 'dowsing-answer') return DOWSING_TEXT_LENGTH + 'truth:'.length
  return judgmentTargetLimit(action)
}
