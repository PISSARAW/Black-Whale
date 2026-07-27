import { redirect, type RequestHandler } from '@sveltejs/kit'
import { ADMIN_SESSION_COOKIE } from '$lib/server/session'

export const POST: RequestHandler = ({ cookies }) => {
  cookies.delete(ADMIN_SESSION_COOKIE, { path: '/' })
  throw redirect(303, '/login')
}
