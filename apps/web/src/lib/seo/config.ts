export const SITE_URL = 'https://exploreblackwhale.com'
export const SITE_NAME = 'Black Whale'
export const SITE_TAGLINE = 'Succession Archive'

export const DEFAULT_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`
export const DEFAULT_DESCRIPTION =
  'An interactive archive of the Hunter × Hunter Succession War: every passenger, deck, faction, Nen ability and shifting perspective aboard the Black Whale.'
export const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`

export const TWITTER_CARD = 'summary_large_image'

/** Builds the browser/tab title, appending the brand unless the page already carries it. */
export function pageTitle(title?: string | null): string {
  if (!title) return DEFAULT_TITLE
  return title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`
}

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString()
}
