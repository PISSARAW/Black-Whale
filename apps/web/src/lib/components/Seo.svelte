<script lang="ts">
  import { page } from '$app/stores'
  import { DEFAULT_IMAGE, SITE_NAME, TWITTER_CARD, absoluteUrl, pageTitle } from '$lib/seo/config'
  import { locale, routePath, t } from '$lib/i18n'
  import { DEFAULT_LOCALE, LOCALE_TAGS, alternatePaths } from '$lib/i18n/config'

  let {
    title = null,
    description = null,
    image = DEFAULT_IMAGE,
    type = 'website',
    noindex = false,
    jsonLd = null,
  }: {
    title?: string | null
    /** Falls back to the site-wide description in the active locale. */
    description?: string | null
    image?: string
    type?: 'website' | 'article' | 'profile'
    noindex?: boolean
    /** A single schema.org node or a list of them, serialised into ld+json. */
    jsonLd?: unknown
  } = $props()

  let resolvedTitle = $derived(pageTitle(title, $t.seo.siteTitle))
  let resolvedDescription = $derived(description ?? $t.seo.siteDescription)
  // Query strings (spoiler filters, selected character, …) are view state, not
  // distinct documents — the canonical always points at the bare path.
  let canonical = $derived(absoluteUrl($page.url.pathname))
  let nodes = $derived(jsonLd === null ? [] : Array.isArray(jsonLd) ? jsonLd : [jsonLd])

  // Each locale is its own indexable document; the alternates tell crawlers they
  // are the same page, and `x-default` names the one to serve when no language
  // preference applies.
  let alternates = $derived(alternatePaths($routePath))
  let defaultAlternate = $derived(
    absoluteUrl(alternates.find((entry) => entry.locale === DEFAULT_LOCALE)!.path),
  )

  // A closing script tag inside a JSON string would end the block early, so
  // every angle bracket is escaped. The bracket itself is built from its char
  // code because the Svelte parser reads a literal one here as markup.
  const LESS_THAN = String.fromCharCode(60)
  const serialise = (node: unknown) => JSON.stringify(node).replaceAll(LESS_THAN, '\\u003c')
</script>

<svelte:head>
  <title>{resolvedTitle}</title>
  <meta name="description" content={resolvedDescription} />
  <link rel="canonical" href={canonical} />
  {#each alternates as alternate (alternate.locale)}
    <link
      rel="alternate"
      hreflang={LOCALE_TAGS[alternate.locale].html}
      href={absoluteUrl(alternate.path)}
    />
  {/each}
  <link rel="alternate" hreflang="x-default" href={defaultAlternate} />
  {#if noindex}
    <meta name="robots" content="noindex, nofollow" />
  {:else}
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  {/if}

  <meta property="og:site_name" content={SITE_NAME} />
  <meta property="og:type" content={type} />
  <meta property="og:title" content={resolvedTitle} />
  <meta property="og:description" content={resolvedDescription} />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={image} />
  <meta property="og:locale" content={LOCALE_TAGS[$locale].openGraph} />
  {#each alternates.filter((alternate) => alternate.locale !== $locale) as alternate (alternate.locale)}
    <meta property="og:locale:alternate" content={LOCALE_TAGS[alternate.locale].openGraph} />
  {/each}

  <meta name="twitter:card" content={TWITTER_CARD} />
  <meta name="twitter:title" content={resolvedTitle} />
  <meta name="twitter:description" content={resolvedDescription} />
  <meta name="twitter:image" content={image} />

  {#each nodes as node, nodeIndex (nodeIndex)}
    <!-- eslint-disable-next-line svelte/no-at-html-tags, no-useless-escape -->
    {@html `<script type="application/ld+json">${serialise(node)}<\/script>`}
  {/each}
</svelte:head>
