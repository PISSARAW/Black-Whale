import type { RequestHandler } from '@sveltejs/kit';

const robots = `User-agent: *
Allow: /

Sitemap: https://exploreblackwhale.com/sitemap.xml
`;

export const GET: RequestHandler = () =>
	new Response(robots, {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': 'public, max-age=86400',
		},
	});
