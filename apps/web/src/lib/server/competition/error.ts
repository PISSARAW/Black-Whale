export class CompetitionError extends Error {
  constructor(readonly code: string) {
    super(code)
    this.name = 'CompetitionError'
  }
}
export function requireCompetition(condition: unknown, code: string): asserts condition {
  if (!condition) throw new CompetitionError(code)
}
