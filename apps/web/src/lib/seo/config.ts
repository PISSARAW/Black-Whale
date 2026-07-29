export const SITE_URL = 'https://exploreblackwhale.com'
export const SITE_NAME = 'Black Whale'
export const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`

export const TWITTER_CARD = 'summary_large_image'

/**
 * Builds the browser/tab title, appending the brand unless the page already
 * carries it. The site-wide fallback is translated, so it is handed in rather
 * than baked in here.
 */
export function pageTitle(title: string | null | undefined, siteTitle: string): string {
  if (!title) return siteTitle
  return title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`
}

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString()
}
