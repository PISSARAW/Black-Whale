import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  ADMIN_SESSION_COOKIE,
  createSession,
  sessionCookieOptions,
  verifyPassword,
} from '$lib/server/session';

function safeNext(value: FormDataEntryValue | string | null): string {
  const next = typeof value === 'string' ? value : '/';
  return next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

export const load: PageServerLoad = ({ locals, url }) => {
  if (locals.authenticated) throw redirect(303, safeNext(url.searchParams.get('next')));
  return { next: safeNext(url.searchParams.get('next')) };
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const password = data.get('password');
    if (typeof password !== 'string' || !verifyPassword(password)) {
      return fail(400, { invalid: true, next: safeNext(data.get('next')) });
    }
    cookies.set(ADMIN_SESSION_COOKIE, createSession(), sessionCookieOptions);
    throw redirect(303, safeNext(data.get('next')));
  },
};
