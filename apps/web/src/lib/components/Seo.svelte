<script lang="ts">
  import { page } from '$app/stores'
  import {
    DEFAULT_DESCRIPTION,
    DEFAULT_IMAGE,
    SITE_NAME,
    TWITTER_CARD,
    absoluteUrl,
    pageTitle,
  } from '$lib/seo/config'

  let {
    title = null,
    description = DEFAULT_DESCRIPTION,
    image = DEFAULT_IMAGE,
    type = 'website',
    noindex = false,
    jsonLd = null,
  }: {
    title?: string | null
    description?: string
    image?: string
    type?: 'website' | 'article' | 'profile'
    noindex?: boolean
    /** A single schema.org node or a list of them, serialised into ld+json. */
    jsonLd?: unknown
  } = $props()

  let resolvedTitle = $derived(pageTitle(title))
  // Query strings (spoiler filters, selected character, …) are view state, not
  // distinct documents — the canonical always points at the bare path.
  let canonical = $derived(absoluteUrl($page.url.pathname))
  let nodes = $derived(jsonLd === null ? [] : Array.isArray(jsonLd) ? jsonLd : [jsonLd])

  // A closing script tag inside a JSON string would end the block early, so
  // every angle bracket is escaped. The bracket itself is built from its char
  // code because the Svelte parser reads a literal one here as markup.
  const LESS_THAN = String.fromCharCode(60)
  const serialise = (node: unknown) => JSON.stringify(node).replaceAll(LESS_THAN, '\\u003c')
</script>

<svelte:head>
  <title>{resolvedTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  {#if noindex}
    <meta name="robots" content="noindex, nofollow" />
  {:else}
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  {/if}

  <meta property="og:site_name" content={SITE_NAME} />
  <meta property="og:type" content={type} />
  <meta property="og:title" content={resolvedTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={image} />
  <meta property="og:locale" content="en_US" />

  <meta name="twitter:card" content={TWITTER_CARD} />
  <meta name="twitter:title" content={resolvedTitle} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={image} />

  {#each nodes as node}
    <!-- eslint-disable-next-line svelte/no-at-html-tags, no-useless-escape -->
    {@html `<script type="application/ld+json">${serialise(node)}<\/script>`}
  {/each}
</svelte:head>
