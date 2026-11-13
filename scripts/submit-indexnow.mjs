import { readFile } from 'node:fs/promises'

const siteUrl = (process.env.SITE_URL ?? 'https://exploreblackwhale.com').replace(/\/$/, '')
const key = process.env.INDEXNOW_KEY?.trim()
const since = process.env.INDEXNOW_SINCE ?? new Date().toISOString().slice(0, 10)

if (!key || !/^[A-Za-z0-9-]{8,128}$/.test(key)) {
  throw new Error('INDEXNOW_KEY must contain 8–128 letters, numbers or hyphens')
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(since)) {
  throw new Error('INDEXNOW_SINCE must be an ISO date (YYYY-MM-DD)')
}

const read = async (path) =>
  JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'))
const [abilities, events, characters] = await Promise.all([
  read('data/abilities/abilities.json'),
  read('data/events/events.json'),
  read('data/characters/characters.json'),
])

const changed = [
  ...abilities
    .filter((entry) => entry.modifiedAt >= since)
    .map((entry) => `/abilities/${encodeURIComponent(entry.id)}`),
  ...events
    .filter((entry) => entry.modifiedAt >= since)
    .map((entry) => `/events/${encodeURIComponent(entry.id)}`),
  ...characters
    .filter((entry) => entry.modifiedAt >= since)
    .map((entry) => `/characters/${encodeURIComponent(entry.id)}`),
]
const paths = [...new Set(changed.flatMap((path) => [path, `/fr${path}`]))]

if (paths.length === 0) {
  console.log(`IndexNow: no catalogue URL changed on or after ${since}.`)
  process.exit(0)
}

for (let index = 0; index < paths.length; index += 10_000) {
  const urlList = paths.slice(index, index + 10_000).map((path) => `${siteUrl}${path}`)
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: new URL(siteUrl).host,
      key,
      keyLocation: `${siteUrl}/indexnow-key.txt`,
      urlList,
    }),
  })
  if (!response.ok) {
    throw new Error(`IndexNow rejected ${urlList.length} URLs: ${response.status}`)
  }
  console.log(`IndexNow accepted ${urlList.length} URLs changed on or after ${since}.`)
}
