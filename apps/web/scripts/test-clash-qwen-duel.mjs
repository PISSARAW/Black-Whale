import { createServer } from 'vite'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
process.chdir(root)
const server = await createServer({
  server: { middlewareMode: true, hmr: false, watch: null },
  cacheDir: '/tmp/black-whale-qwen-duel-cache',
  appType: 'custom',
})
try {
  const { testQwenDuel } = await server.ssrLoadModule('/demos/fighting-ai-duel/qwenDuel.ts')
  const { askClashQwen } = await server.ssrLoadModule('/src/lib/server/clashQwen.ts')
  const env = {
    CLASH_OLLAMA_URL: process.env.CLASH_OLLAMA_URL ?? 'http://127.0.0.1:11439',
    CLASH_OLLAMA_MODEL: process.env.CLASH_OLLAMA_MODEL ?? 'qwen2.5:1.5b',
    CLASH_OLLAMA_TOKEN: process.env.CLASH_OLLAMA_TOKEN,
  }
  const result = await testQwenDuel({
    transport: (observation, signal) =>
      askClashQwen({ env, observation, fetcher: (url, init) => fetch(url, { ...init, signal }) }),
    progress: (value) => process.stdout.write(JSON.stringify(value) + '\n'),
  })
  const output = resolve(root, '../../output/hisoka-machi-qwen')
  await mkdir(output, { recursive: true })
  await writeFile(
    resolve(output, 'Hisoka-vs-Machi-Qwen.bw-replay.json'),
    JSON.stringify(result.replay),
  )
  await writeFile(resolve(output, 'duel-report.json'), JSON.stringify(result.report, null, 2))
  process.stdout.write(
    JSON.stringify({ ...result.report, evidence: result.report.evidence.length }) + '\n',
  )
} finally {
  await server.close()
}
