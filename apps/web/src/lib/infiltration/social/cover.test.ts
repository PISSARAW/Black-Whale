import { describe, expect, it } from 'vitest'
import { evaluateCover, type CoverProfile } from './cover'

const cover: CoverProfile = { role: 'maintenance', superior: 'Mizaistom', assignment: 'ventilation', allowedSpaces: ['hall'], evidence: ['work-order'], obligations: ['inspect-panel'] }
describe('composable cover', () => {
  it('explains permissions and contradictions independently', () => {
    expect(evaluateCover(cover, 'hall', [{ subject: 'role', value: 'maintenance', at: 1 }]).credible).toBe(true)
    const result = evaluateCover(cover, 'office', [{ subject: 'role', value: 'security', at: 1 }, { subject: 'role', value: 'maintenance', at: 2 }])
    expect(result.permitted).toBe(false)
    expect(result.contradictions).toHaveLength(1)
  })
})
