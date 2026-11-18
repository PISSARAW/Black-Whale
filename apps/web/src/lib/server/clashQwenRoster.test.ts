import { describe, expect, it } from 'vitest'
import { FIGHTING_ROSTER } from '$lib/fighting/roster'
import { beginFight, createFight } from '$lib/fighting/engine'
import { observeCombat } from '$lib/fighting/qwen/observation'
import { offeredMoves, fighterRules } from '$lib/fighting/qwen/catalogue'
import { askClashQwen, validCombatObservation } from './clashQwen'
import { utilityKey } from '$lib/fighting/qwen/utilities'

const env = { CLASH_OLLAMA_URL: 'http://private.test', CLASH_OLLAMA_MODEL: 'qwen-fixture' }
describe('Qwen roster request boundary', () => {
  it.each(FIGHTING_ROSTER.map((fighter) => fighter.id))(
    '%s uses its actual catalogue and accepts only its offered actions',
    async (id) => {
      const state = beginFight(createFight(id, 'machi', { mode: 'versus-local' }))
      const observed = observeCombat(state, 'player')
      expect(validCombatObservation(observed)).toBe(true)
      const move = offeredMoves(observed)[0]?.slot ?? 'none'
      let request: Record<string, unknown> = {}
      const fetcher = async (_url: unknown, init: RequestInit | undefined) => {
        request = JSON.parse(String(init?.body))
        return new Response(
          JSON.stringify({
            message: { content: JSON.stringify({ goal: 'pressure', nen: 'ten', move }) },
          }),
        )
      }
      const answer = await askClashQwen({
        env,
        observation: observed,
        fetcher: fetcher as typeof fetch,
      })
      expect(answer?.plan.move).toBe(move)
      const messages = request.messages as { role: string; content: string }[]
      expect(messages[0].content).toContain(fighterRules(id))
      const supplied = JSON.parse(messages[1].content)
      expect(supplied.fighter).toBe(id)
      expect(supplied).not.toHaveProperty('opponent')
      expect(supplied.enemy).not.toHaveProperty('aura')
    },
  )
  it('rejects fabricated panel actions, malformed keys and duplicates', () => {
    const observation = observeCombat(createFight('chrollo', 'machi'), 'player')
    expect(
      validCombatObservation({
        ...observation,
        utilities: [{ command: { action: 'invent-ability' }, key: 'utility:new' }],
      }),
    ).toBe(false)
    expect(
      validCombatObservation({
        ...observation,
        utilities: [
          { command: { action: 'history-page', target: 'sun-and-moon' }, key: 'utility:wrong' },
        ],
      }),
    ).toBe(false)
    expect(
      validCombatObservation({
        ...observation,
        moves: [observation.moves[0], observation.moves[0]],
      }),
    ).toBe(false)
  })
  it('can request a native panel choice without allowing unoffered targets', async () => {
    const observation = observeCombat(createFight('chrollo', 'machi'), 'player')
    const utility = observation.utilities![0]
    expect(utility).toBeTruthy()
    let selected = utility.key
    const fetcher = async () =>
      new Response(
        JSON.stringify({
          message: { content: JSON.stringify({ goal: 'bait', nen: 'ten', move: selected }) },
        }),
      )
    expect((await askClashQwen({ env, observation, fetcher }))?.plan.move).toBe(utility.key)
    selected = utilityKey({ action: 'history-use', target: 'made-up-page' })
    expect(await askClashQwen({ env, observation, fetcher })).toBeNull()
  })
  it('rejects a model claiming unqualified En instead of treating it as learned', async () => {
    const observation = observeCombat(createFight('bill', 'machi'), 'player')
    const fetcher = async () =>
      new Response(
        JSON.stringify({ message: { content: '{"goal":"bait","nen":"en","move":"none"}' } }),
      )
    expect(await askClashQwen({ env, observation, fetcher })).toBeNull()
  })
})
