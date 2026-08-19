import { redirect, type RequestHandler } from '@sveltejs/kit'
import { clearSpoilerLimit, writeSpoilerLimit } from '$lib/server/spoiler'

/**
 * The only writer of the reader's spoiler cap. It is an endpoint rather than a
 * page action so the control can live in the root layout — a layout cannot host
 * a form action — and a plain form POST still works with JavaScript disabled.
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
  const form = await request.formData()
  const raw = String(form.get('chapter') ?? '').trim()
  const parsed = Number.parseInt(raw, 10)

  if (form.get('intent') === 'clear' || raw === '') {
    clearSpoilerLimit(cookies)
  } else if (Number.isSafeInteger(parsed) && parsed >= 0) {
    writeSpoilerLimit(cookies, parsed)
  }
  // Anything else is junk from a hand-made request: leave the current cap alone
  // rather than widening it, and send the reader back where they were.

  redirect(303, sameOriginPath(form.get('redirectTo')))
}

/**
 * The form carries the page to return to, so any route can host the control. It
 * is attacker-controllable input, so only a path on this site is honoured —
 * `//evil.example` included, which a browser reads as another origin.
 */
function sameOriginPath(value: FormDataEntryValue | null): string {
  const path = typeof value === 'string' ? value : ''
  return path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\') ? path : '/'
}
