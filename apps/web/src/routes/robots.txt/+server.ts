import type { RequestHandler } from '@sveltejs/kit';
import { SITE_URL } from '$lib/seo/config';

// /health is a probe, /_map-preview is a design harness, and the placeholder
// body/consciousness/knowledge detail pages carry no canon content yet.
const robots = `User-agent: *
Allow: /
Disallow: /health
Disallow: /_map-preview
Disallow: /bodies/
Disallow: /consciousness/
Disallow: /knowledge/
Disallow: /perspectives/*/

Sitemap: ${SITE_URL}/sitemap.xml
`;

export const GET: RequestHandler = () =>
	new Response(robots, {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': 'public, max-age=86400',
		},
	});
