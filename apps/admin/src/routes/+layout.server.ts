import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, locals }) => {
	const spoilerLimitCookie = cookies.get('adminSpoilerLimit');
	// Cookie values are client-controlled; reject anything that is not a plain
	// non-negative integer rather than passing NaN downstream.
	const parsed = spoilerLimitCookie ? Number.parseInt(spoilerLimitCookie, 10) : Number.NaN;
	const spoilerLimit = Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;

	return { spoilerLimit, authenticated: locals.authenticated };
};
