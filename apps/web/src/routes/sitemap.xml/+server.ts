import type { RequestHandler } from '@sveltejs/kit'
import characterCatalogue from '../../../../../data/characters/characters.json'
import { SITE_URL } from '$lib/seo/config'
import { LOCALES, LOCALE_TAGS, localizePath } from '$lib/i18n/config'

type SitemapEntry = { path: string; changefreq: string; priority: string }

const staticRoutes: SitemapEntry[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/ship', changefreq: 'weekly', priority: '0.9' },
  { path: '/tour', changefreq: 'monthly', priority: '0.8' },
  { path: '/tour/sources', changefreq: 'monthly', priority: '0.6' },
  { path: '/tour/morena', changefreq: 'monthly', priority: '0.6' },
  { path: '/characters', changefreq: 'weekly', priority: '0.9' },
  { path: '/timeline', changefreq: 'weekly', priority: '0.8' },
  { path: '/perspectives', changefreq: 'weekly', priority: '0.8' },
  { path: '/relationships', changefreq: 'weekly', priority: '0.7' },
  { path: '/abilities', changefreq: 'weekly', priority: '0.7' },
  { path: '/compare', changefreq: 'monthly', priority: '0.6' },
  { path: '/simulations', changefreq: 'monthly', priority: '0.5' },
]

// The catalogue ships with the bundle, so the moment this server booted is the
// moment its content was last published — a defensible <lastmod> for every URL.
const LAST_MODIFIED = new Date().toISOString().slice(0, 10)

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
}))

export const GET: RequestHandler = () => {
  // Every route exists once per locale, and each entry lists all of its
  // translations so a crawler that finds one finds the others.
  const urls = [...staticRoutes, ...characterRoutes]
    .flatMap(({ path, changefreq, priority }) => {
      const alternates = LOCALES.map(
        (locale) =>
          `      <xhtml:link rel="alternate" hreflang="${LOCALE_TAGS[locale].html}" href="${escapeXml(`${SITE_URL}${localizePath(path, locale)}`)}" />`,
      ).join('\n')

      return LOCALES.map(
        (locale) =>
          `  <url>\n    <loc>${escapeXml(`${SITE_URL}${localizePath(path, locale)}`)}</loc>\n${alternates}\n    <lastmod>${LAST_MODIFIED}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
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
