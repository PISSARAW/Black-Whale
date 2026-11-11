/**
 * The one door to the language model running beside the site.
 *
 * Ollama is optional. With `OLLAMA_URL` or `OLLAMA_MODEL` unset there is no
 * model, `ollamaConfig` says so, and every caller is expected to carry on
 * without one — nothing on the site may depend on an answer arriving.
 *
 * The call is a single non-streamed chat turn constrained to a JSON schema, on
 * a deadline. A model on a CPU can take longer than a visitor will wait, and a
 * late answer is worth nothing, so a timeout is a normal outcome here and comes
 * back as `null` like every other failure.
 */
import { describeError, log } from './log'

export interface OllamaConfig {
  url: string
  model: string
}

/** Read from the environment; `null` when the model is not configured. */
export function ollamaConfig(
  env: Record<string, string | undefined> = process.env,
): OllamaConfig | null {
  const url = env.OLLAMA_URL?.trim().replace(/\/+$/, '')
  const model = env.OLLAMA_MODEL?.trim()
  if (!url || !model || !/^https?:\/\//.test(url)) return null
  return { url, model }
}

export interface OllamaQuestion {
  system: string
  user: string
  /** JSON schema the reply is constrained to. */
  schema: Record<string, unknown>
  timeoutMs?: number
  /** Upper bound on generated tokens; the answers asked for here are short. */
  maxTokens?: number
}

type Fetcher = typeof fetch

/**
 * Models that reason before answering are told not to: the reasoning is never
 * shown and only costs seconds. A model without that switch may refuse the
 * request outright, so a refusal is retried once without it and remembered.
 */
const refusesThinkSwitch = new Set<string>()

function requestBody(config: OllamaConfig, question: OllamaQuestion, think: boolean): string {
  return JSON.stringify({
    model: config.model,
    stream: false,
    format: question.schema,
    keep_alive: '30m',
    ...(think ? { think: false } : {}),
    options: { temperature: 0, num_predict: question.maxTokens ?? 64 },
    messages: [
      { role: 'system', content: question.system },
      { role: 'user', content: question.user },
    ],
  })
}

/** The model's reply as text, or `null` if it did not answer in time or at all. */
export async function askOllama(
  config: OllamaConfig,
  question: OllamaQuestion,
  fetcher: Fetcher = fetch,
): Promise<string | null> {
  const signal = AbortSignal.timeout(question.timeoutMs ?? 8_000)
  const post = (think: boolean) =>
    fetcher(`${config.url}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: requestBody(config, question, think),
      signal,
    })

  try {
    let response = await post(!refusesThinkSwitch.has(config.model))
    if (response.status === 400 && !refusesThinkSwitch.has(config.model)) {
      refusesThinkSwitch.add(config.model)
      response = await post(false)
    }
    if (!response.ok) {
      log.warn('Ollama refused the request', { status: response.status, model: config.model })
      return null
    }
    const payload = (await response.json()) as { message?: { content?: unknown } }
    const content = payload.message?.content
    return typeof content === 'string' ? content : null
  } catch (error) {
    log.warn('Ollama did not answer', describeError(error))
    return null
  }
}
