import type { RequestHandler } from '@sveltejs/kit'
import characterCatalogue from '../../../../../data/characters/characters.json'
import abilityCatalogue from '../../../../../data/abilities/abilities.json'
import eventCatalogue from '../../../../../data/events/events.json'
import { SITE_URL } from '$lib/seo/config'
import { LOCALES, LOCALE_TAGS, localizePath } from '$lib/i18n/config'
import { PUBLIC_FEATURES } from '$lib/config/features'

type SitemapEntry = { path: string; changefreq: string; priority: string; lastmod: string }

const maxModified = (items: Array<{ modifiedAt: string }>) =>
  items.reduce(
    (latest, item) => (item.modifiedAt > latest ? item.modifiedAt : latest),
    '1970-01-01',
  )

const CHARACTER_LASTMOD = maxModified(characterCatalogue)
const ABILITY_LASTMOD = maxModified(abilityCatalogue)
const EVENT_LASTMOD = maxModified(eventCatalogue)
const EDITORIAL_LASTMOD = '2026-11-13'

const staticRoutes: SitemapEntry[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0', lastmod: EDITORIAL_LASTMOD },
  { path: '/ship', changefreq: 'weekly', priority: '0.9', lastmod: EVENT_LASTMOD },
  { path: '/tour', changefreq: 'monthly', priority: '0.8', lastmod: EDITORIAL_LASTMOD },
  { path: '/tour/modes', changefreq: 'monthly', priority: '0.7', lastmod: EDITORIAL_LASTMOD },
  { path: '/tour/sources', changefreq: 'monthly', priority: '0.6', lastmod: EDITORIAL_LASTMOD },
  { path: '/tour/morena', changefreq: 'monthly', priority: '0.6', lastmod: EDITORIAL_LASTMOD },
  { path: '/characters', changefreq: 'weekly', priority: '0.9', lastmod: CHARACTER_LASTMOD },
  { path: '/timeline', changefreq: 'weekly', priority: '0.8', lastmod: EVENT_LASTMOD },
  ...(PUBLIC_FEATURES.perspectives
    ? [{ path: '/perspectives', changefreq: 'weekly', priority: '0.8', lastmod: CHARACTER_LASTMOD }]
    : []),
  { path: '/relationships', changefreq: 'weekly', priority: '0.7', lastmod: CHARACTER_LASTMOD },
  { path: '/abilities', changefreq: 'weekly', priority: '0.7', lastmod: ABILITY_LASTMOD },
  ...(PUBLIC_FEATURES.compare
    ? [{ path: '/compare', changefreq: 'monthly', priority: '0.6', lastmod: CHARACTER_LASTMOD }]
    : []),
  { path: '/simulations', changefreq: 'monthly', priority: '0.5', lastmod: EVENT_LASTMOD },
  { path: '/about', changefreq: 'monthly', priority: '0.6', lastmod: EDITORIAL_LASTMOD },
]

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

const characterRoutes: SitemapEntry[] = characterCatalogue.map(({ id }) => ({
  path: `/characters/${encodeURIComponent(id)}`,
  changefreq: 'monthly',
  priority: '0.6',
  lastmod: characterCatalogue.find((character) => character.id === id)!.modifiedAt,
}))

const abilityRoutes: SitemapEntry[] = abilityCatalogue.map(({ id, modifiedAt }) => ({
  path: `/abilities/${encodeURIComponent(id)}`,
  changefreq: 'monthly',
  priority: '0.7',
  lastmod: modifiedAt,
}))

const eventRoutes: SitemapEntry[] = eventCatalogue.map(({ id, modifiedAt }) => ({
  path: `/events/${encodeURIComponent(id)}`,
  changefreq: 'monthly',
  priority: '0.6',
  lastmod: modifiedAt,
}))

export const GET: RequestHandler = () => {
  // Every route exists once per locale, and each entry lists all of its
  // translations so a crawler that finds one finds the others.
  const urls = [...staticRoutes, ...characterRoutes, ...abilityRoutes, ...eventRoutes]
    .flatMap(({ path, changefreq, priority, lastmod }) => {
      const alternates = LOCALES.map(
        (locale) =>
          `      <xhtml:link rel="alternate" hreflang="${LOCALE_TAGS[locale].html}" href="${escapeXml(`${SITE_URL}${localizePath(path, locale)}`)}" />`,
      ).join('\n')

      return LOCALES.map(
        (locale) =>
          `  <url>\n    <loc>${escapeXml(`${SITE_URL}${localizePath(path, locale)}`)}</loc>\n${alternates}\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
      )
    })
    .join('\n')
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`

  return new Response(sitemap, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
}
