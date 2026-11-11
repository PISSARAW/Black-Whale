import { describe, expect, it, vi } from 'vitest'
import { createRouter, routerQuestion } from './castQuestion'

describe('routerQuestion', () => {
  it('gives the model the typed line and the topics, and nothing about the body', () => {
    const question = routerQuestion('Tu as peur ?', 'fr')
    expect(question.user).toBe('Tu as peur ?')
    expect(question.schema).toEqual({
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          enum: ['who', 'allegiance', 'since', 'route', 'nen', 'techniques', 'none'],
        },
      },
      required: ['topic'],
    })
  })
})

describe('createRouter', () => {
  it('settles a phrase without the model, even when none is configured', async () => {
    const route = createRouter(null)
    expect(await route('Et ton Nen ?', 'fr')).toEqual({ status: 'ok', topic: 'nen' })
  })

  it('is off for a free question when no model is configured', async () => {
    expect(await createRouter(null)('Tu as peur de mourir ?', 'fr')).toEqual({ status: 'off' })
  })

  it('rejects what is not a question', async () => {
    const ask = vi.fn()
    expect(await createRouter(ask)('?!', 'fr')).toEqual({ status: 'rejected' })
    expect(ask).not.toHaveBeenCalled()
  })

  it('asks the model once per question and remembers the topic', async () => {
    const ask = vi.fn().mockResolvedValue('{"topic":"allegiance"}')
    const route = createRouter(ask)
    expect(await route('Tu roules pour la Mafia ?', 'fr')).toEqual({
      status: 'ok',
      topic: 'allegiance',
    })
    expect(await route('tu roules pour la mafia ?', 'fr')).toEqual({
      status: 'ok',
      topic: 'allegiance',
    })
    expect(ask).toHaveBeenCalledTimes(1)
  })

  it('turns a reply outside the list into none', async () => {
    const route = createRouter(vi.fn().mockResolvedValue('{"topic":"He dies at chapter 400"}'))
    expect(await route('Tu vas survivre ?', 'fr')).toEqual({ status: 'ok', topic: 'none' })
  })

  it('reports a model that did not answer as busy, and does not remember it', async () => {
    const ask = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce('{"topic":"route"}')
    const route = createRouter(ask)
    expect(await route('Tu traînais où hier ?', 'fr')).toEqual({ status: 'busy' })
    expect(await route('Tu traînais où hier ?', 'fr')).toEqual({ status: 'ok', topic: 'route' })
  })

  it('tells a second visitor it is busy rather than queueing them', async () => {
    let release: (value: string) => void = () => {}
    const ask = vi.fn(() => new Promise<string>((resolve) => (release = resolve)))
    const route = createRouter(ask)
    const first = route('Tu as peur ?', 'fr')
    expect(await route('Tu dors bien ?', 'fr')).toEqual({ status: 'busy' })
    release('{"topic":"none"}')
    expect(await first).toEqual({ status: 'ok', topic: 'none' })
  })
})
