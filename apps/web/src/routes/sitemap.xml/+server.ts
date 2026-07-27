import type { RequestHandler } from '@sveltejs/kit';
import characterCatalogue from '../../../../../data/characters/characters.json';
import { SITE_URL } from '$lib/seo/config';

type SitemapEntry = { path: string; changefreq: string; priority: string };

const staticRoutes: SitemapEntry[] = [
	{ path: '/', changefreq: 'weekly', priority: '1.0' },
	{ path: '/ship', changefreq: 'weekly', priority: '0.9' },
	{ path: '/characters', changefreq: 'weekly', priority: '0.9' },
	{ path: '/timeline', changefreq: 'weekly', priority: '0.8' },
	{ path: '/perspectives', changefreq: 'weekly', priority: '0.8' },
	{ path: '/relationships', changefreq: 'weekly', priority: '0.7' },
	{ path: '/abilities', changefreq: 'weekly', priority: '0.7' },
	{ path: '/compare', changefreq: 'monthly', priority: '0.6' },
	{ path: '/simulations', changefreq: 'monthly', priority: '0.5' },
];

// The catalogue ships with the bundle, so the moment this server booted is the
// moment its content was last published — a defensible <lastmod> for every URL.
const LAST_MODIFIED = new Date().toISOString().slice(0, 10);

const escapeXml = (value: string) =>
	value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

const characterRoutes: SitemapEntry[] = characterCatalogue.map(({ id }) => ({
	path: `/characters/${encodeURIComponent(id)}`,
	changefreq: 'monthly',
	priority: '0.6',
}));

export const GET: RequestHandler = () => {
	const urls = [...staticRoutes, ...characterRoutes]
		.map(
			({ path, changefreq, priority }) =>
				`  <url>\n    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>\n    <lastmod>${LAST_MODIFIED}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
		)
		.join('\n');
	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

	return new Response(sitemap, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=3600',
		},
	});
};
