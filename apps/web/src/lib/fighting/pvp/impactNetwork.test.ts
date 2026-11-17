import { describe, expect, it } from 'vitest'
import { COMBAT_FIGHTERS, COMBAT_ROUTES } from '../combatRoutes'
import {
  comboImpactPlan,
  defenseImpactPlan,
} from '../../../../ui-tests/fighting-response/impactPlans'
import { runImpactNetwork } from '../../../../ui-tests/fighting-response/impactNetworkLab'
import { combatRouteContacts } from '../combatRouteContacts'

describe('actual combo impacts across the input pipeline, authority and replay', () => {
  for (const route of COMBAT_ROUTES)
    for (const side of ['player', 'opponent'] as const)
      it.each([0, 50, 100, 150])(`${route.id}, ${side}, RTT %sms`, async (rtt) => {
        const result = await runImpactNetwork({
          ...comboImpactPlan(route, side),
          rtt,
          faults: true,
        })
        expect(result.failures).toEqual([])
        expect(result.hashesMatch).toBe(true)
        expect(result.replayMatches).toBe(true)
        const hits = result.contacts.filter((hit) => hit.impact?.attacker === side)
        const expected = combatRouteContacts(route)
        if (route.hits) {
          // A frame snapshot can include two bullet hits but only describes its final impact.
          expect(hits.at(-1)?.impact?.comboHits).toBe(expected.length)
          for (const hit of hits) expect(hit.move).toBe(expected[hit.impact!.comboHits! - 1])
        } else {
          expect(
            hits.map((hit) => hit.move),
            JSON.stringify({
              commands: result.applications,
              contacts: hits.map((hit) => ({ frame: hit.frame, move: hit.move })),
              feedback: result.final.commandFeedback,
            }),
          ).toEqual(expected)
          expect(hits.map((hit) => hit.impact?.comboHits)).toEqual(expected.map((_, i) => i + 1))
        }
        expect(hits.every((hit) => !hit.impact?.blocked && !hit.impact?.avoided)).toBe(true)
      })
})

describe('confirmed guard then real punish across both seats under latency', () => {
  for (const fighter of COMBAT_FIGHTERS)
    for (const side of ['player', 'opponent'] as const)
      it.each([0, 50, 100, 150])(`${fighter}, ${side}, RTT %sms`, async (rtt) => {
        const result = await runImpactNetwork({
          ...defenseImpactPlan(fighter, side),
          rtt,
          faults: true,
        })
        expect(result.failures).toEqual([])
        expect(result.hashesMatch).toBe(true)
        expect(result.replayMatches).toBe(true)
        expect(
          result.contacts.some((hit) => hit.impact?.attacker !== side && hit.impact?.blocked),
        ).toBe(true)
        expect(
          result.contacts.some(
            (hit) => hit.impact?.attacker === side && hit.impact?.punish && !hit.impact?.blocked,
          ),
        ).toBe(true)
      })
})
