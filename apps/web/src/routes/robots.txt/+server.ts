import type { RequestHandler } from '@sveltejs/kit'
import { SITE_URL } from '$lib/seo/config'
import { LOCALES, localizePath } from '$lib/i18n/config'

// /health is a probe, /_map-preview is a design harness, and the placeholder
// body/consciousness/knowledge detail pages carry no canon content yet. Each one
// is reachable under every locale prefix, so each has to be named per locale.
const disallowed = [
  '/health',
  '/_map-preview',
  '/bodies/',
  '/consciousness/',
  '/knowledge/',
  '/perspectives/*/',
]

const disallowRules = disallowed
  .flatMap((path) => LOCALES.map((locale) => `Disallow: ${localizePath(path, locale)}`))
  .join('\n')

const robots = `User-agent: *
Allow: /
${disallowRules}

Sitemap: ${SITE_URL}/sitemap.xml
`

export const GET: RequestHandler = () =>
  new Response(robots, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=86400',
    },
  })
