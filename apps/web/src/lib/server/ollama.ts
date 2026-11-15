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
  token?: string
  timeoutMs?: number
}

function privateOptions(env: Record<string, string | undefined>) {
  const token = env.OLLAMA_TOKEN?.trim()
  const timeoutMs = Number(env.OLLAMA_TIMEOUT_MS)
  return {
    ...(token ? { token } : {}),
    ...(Number.isInteger(timeoutMs) && timeoutMs >= 1_000 && timeoutMs <= 30_000
      ? { timeoutMs }
      : {}),
  }
}

/** Read from the environment; `null` when the model is not configured. */
export function ollamaConfig(
  env: Record<string, string | undefined> = process.env,
): OllamaConfig | null {
  const url = env.OLLAMA_URL?.trim().replace(/\/+$/, '')
  const model = env.OLLAMA_MODEL?.trim()
  if (!url || !model || !/^https?:\/\//.test(url)) return null
  return { url, model, ...privateOptions(env) }
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

function headersFor(config: OllamaConfig): Record<string, string> {
  return {
    'content-type': 'application/json',
    ...(config.token ? { authorization: `Bearer ${config.token}` } : {}),
  }
}

function replyContent(
  payload: { message?: { content?: unknown } },
  details: { config: OllamaConfig; started: number; response: Response },
): string | null {
  const content = payload.message?.content
  if (typeof content !== 'string') return null
  log.info('Ollama answered', {
    model: details.config.model,
    elapsedMs: Date.now() - details.started,
    inferenceId: details.response.headers.get('x-inference-id'),
  })
  return content
}

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
  const signal = AbortSignal.timeout(question.timeoutMs ?? config.timeoutMs ?? 8_000)
  const started = Date.now()
  const post = (think: boolean) =>
    fetcher(`${config.url}/api/chat`, {
      method: 'POST',
      headers: headersFor(config),
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
    return replyContent(payload, { config, started, response })
  } catch (error) {
    log.warn('Ollama did not answer', describeError(error))
    return null
  }
}
