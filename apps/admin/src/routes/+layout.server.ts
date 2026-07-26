import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, locals }) => {
	const spoilerLimitCookie = cookies.get('adminSpoilerLimit');
	const spoilerLimit = spoilerLimitCookie ? parseInt(spoilerLimitCookie) : null;

	return { spoilerLimit, authenticated: locals.authenticated };
};
