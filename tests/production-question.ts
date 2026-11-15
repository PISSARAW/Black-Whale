/** A fresh utterance makes live checks exercise inference rather than a previous reply cache. */
export function liveQuestion(question: string): string {
  return `${question} [${Date.now().toString(36)}]`
}
