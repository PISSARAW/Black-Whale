import { describe, expect, it, vi } from 'vitest'
import { askOllama, ollamaConfig } from './ollama'
import { createInterpreter, interpreterQuestion, parseKeywords } from './tourSearch'

const reply = (keywords: string[]) => JSON.stringify({ keywords })

describe('ollamaConfig', () => {
  it('is absent unless both the address and the model are set', () => {
    expect(ollamaConfig({})).toBeNull()
    expect(ollamaConfig({ OLLAMA_URL: 'http://host:11434' })).toBeNull()
    expect(ollamaConfig({ OLLAMA_URL: 'host:11434', OLLAMA_MODEL: 'qwen' })).toBeNull()
    expect(ollamaConfig({ OLLAMA_URL: 'http://host:11434/', OLLAMA_MODEL: ' qwen ' })).toEqual({
      url: 'http://host:11434',
      model: 'qwen',
    })
  })
})

describe('askOllama', () => {
  const config = { url: 'http://host:11434', model: 'test-model' }
  const question = { system: 's', user: 'u', schema: { type: 'object' } }
  const answer = (content: unknown, status = 200) =>
    new Response(JSON.stringify({ message: { content } }), { status })

  it('returns the text of the reply', async () => {
    const fetcher = vi.fn(async () => answer('{"keywords":[]}'))
    expect(await askOllama(config, question, fetcher)).toBe('{"keywords":[]}')
    expect(fetcher).toHaveBeenCalledWith('http://host:11434/api/chat', expect.anything())
  })

  it('retries once without the thinking switch when the model refuses it', async () => {
    const bodies: Array<Record<string, unknown>> = []
    const fetcher = vi.fn(async (_url: unknown, init?: RequestInit) => {
      bodies.push(JSON.parse(String(init?.body)))
      return bodies.length === 1 ? answer('', 400) : answer('ok')
    })
    expect(await askOllama({ ...config, model: 'no-think' }, question, fetcher)).toBe('ok')
    expect(bodies[0]).toHaveProperty('think', false)
    expect(bodies[1]).not.toHaveProperty('think')
  })

  it('is null when the model fails or cannot be reached', async () => {
    expect(await askOllama(config, question, async () => answer('', 500))).toBeNull()
    expect(
      await askOllama(config, question, async () => {
        throw new Error('unreachable')
      }),
    ).toBeNull()
  })
})

describe('parseKeywords', () => {
  it('reads the keywords and nothing else', () => {
    expect(parseKeywords(reply(['cuisine', 'prince']))).toEqual(['cuisine', 'prince'])
    expect(parseKeywords('{"keywords":["a",3,null]}')).toEqual(['a'])
    expect(parseKeywords('not json')).toEqual([])
    expect(parseKeywords('{"rooms":["a"]}')).toEqual([])
    expect(parseKeywords(null)).toEqual([])
  })
})

describe('interpreterQuestion', () => {
  it('confines the reply to the vocabulary', () => {
    const question = interpreterQuestion('où manger', 'fr', ['cuisine', 'salon'])
    expect(question.system).toContain('cuisine, salon')
    expect(question.user).toBe('où manger')
    expect(JSON.stringify(question.schema)).toContain('"enum":["cuisine","salon"]')
  })
})

describe('createInterpreter', () => {
  it('is off without a model and never asks', async () => {
    expect(await createInterpreter(null)('où dort le prince', 'fr')).toEqual({ status: 'off' })
  })

  it('refuses what is not a question before spending the model on it', async () => {
    const ask = vi.fn(async () => reply([]))
    expect(await createInterpreter(ask)('cuisinne', 'fr')).toEqual({ status: 'rejected' })
    expect(ask).not.toHaveBeenCalled()
  })

  it('keeps only words the ship has, and asks the same question once', async () => {
    const ask = vi.fn(async () => reply(['cuisine', 'piscine']))
    const interpret = createInterpreter(ask)
    const first = await interpret('où peut-on se restaurer', 'fr')
    expect(first).toEqual({ status: 'ok', keywords: ['cuisine'] })
    expect(await interpret('  Où peut-on   se restaurer ', 'fr')).toEqual(first)
    expect(ask).toHaveBeenCalledTimes(1)
  })

  it('answers one visitor at a time', async () => {
    let release: (value: string) => void = () => {}
    const ask = vi.fn(() => new Promise<string>((resolve) => (release = resolve)))
    const interpret = createInterpreter(ask)
    const first = interpret('où peut-on se restaurer', 'fr')
    expect(await interpret('où sont les gardes', 'fr')).toEqual({ status: 'busy' })
    release(reply(['cuisine']))
    expect(await first).toEqual({ status: 'ok', keywords: ['cuisine'] })
  })

  it('does not remember a model that failed to answer', async () => {
    const ask = vi
      .fn<() => Promise<string | null>>()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(reply(['cuisine']))
    const interpret = createInterpreter(ask)
    expect(await interpret('où peut-on se restaurer', 'fr')).toEqual({ status: 'busy' })
    expect(await interpret('où peut-on se restaurer', 'fr')).toEqual({
      status: 'ok',
      keywords: ['cuisine'],
    })
  })
})
