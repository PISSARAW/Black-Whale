import type { RequestHandler } from '@sveltejs/kit';
import characterCatalogue from '../../../../../data/characters/characters.json';

const SITE_URL = 'https://exploreblackwhale.com';

const staticRoutes = [
	'/',
	'/ship',
	'/timeline',
	'/characters',
	'/perspectives',
	'/abilities',
	'/compare',
	'/relationships',
	'/simulations',
];

const escapeXml = (value: string) =>
	value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

const characterRoutes = characterCatalogue.map(({ id }) => `/characters/${encodeURIComponent(id)}`);

export const GET: RequestHandler = () => {
	const routes = [...staticRoutes, ...characterRoutes];
	const urls = routes.map((route) => `  <url><loc>${escapeXml(`${SITE_URL}${route}`)}</loc></url>`).join('\n');
	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

	return new Response(sitemap, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=3600',
		},
	});
};
