import type { RequestHandler } from './$types'
import { SITE_URL } from '$lib/seo/config'
import { DISCOVERY_ROUTES, markdownDiscoveryLinks } from '$lib/seo/discovery'

const indexLinks = markdownDiscoveryLinks(DISCOVERY_ROUTES.indexes, SITE_URL)
const methodLinks = markdownDiscoveryLinks(
  [...DISCOVERY_ROUTES.method, DISCOVERY_ROUTES.sitemap],
  SITE_URL,
)

const body = `# Black Whale

> Unofficial, non-commercial, bilingual Hunter × Hunter archive focused on the Black Whale voyage and the Succession Contest.

Black Whale publishes server-rendered, source-linked records for characters, Nen abilities and canonical events. English uses unprefixed URLs; French uses /fr. Reader-selected spoiler limits are enforced on the server.

## Core indexes

${indexLinks}

## Method and sources

${methodLinks}

Hunter × Hunter was created by Yoshihiro Togashi and is published by Shueisha. Black Whale is not affiliated with either rights holder and hosts no scans.
`

export const GET: RequestHandler = () =>
  new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
