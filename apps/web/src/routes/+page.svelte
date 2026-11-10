<script lang="ts">
  import MangaIcon from '$lib/components/icons/MangaIcon.svelte'
  import type { PageData } from './$types'
  import BlackWhaleVoyage from '$lib/components/home/BlackWhaleVoyage.svelte'
  import Seo from '$lib/components/Seo.svelte'
  import { websiteSchema } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'
  import { LOCALE_TAGS } from '$lib/i18n/config'
  import { PUBLIC_FEATURES } from '$lib/config/features'

  let { data }: { data: PageData } = $props()

  // A fixed time zone keeps the server render and the hydrated markup identical
  // whatever the visitor's machine is set to; the locale follows the copy.
  let dateFormatter = $derived(
    new Intl.DateTimeFormat($t.common.intlLocale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }),
  )
  let formatDate = $derived((value: string) => dateFormatter.format(new Date(value)))

  let dossiers = $derived([
    { href: '/characters', title: $t.nav.characters, copy: $t.registry.note },
    { href: '/timeline', ...$t.home.dossiers.timeline },
    ...(PUBLIC_FEATURES.perspectives
      ? [{ href: '/perspectives', ...$t.home.dossiers.perspectives }]
      : []),
  ])
</script>

<Seo
  description={$t.home.seoDescription}
  jsonLd={websiteSchema({
    description: $t.seo.siteDescription,
    language: LOCALE_TAGS[$locale].html,
    path: $link('/'),
  })}
/>

<div class="home-page">
  <section class="hero">
    <div class="hero-copy">
      <p class="archive-label">{$t.layout.brandTagline}</p>
      <h1>{$t.home.titleBrand}</h1>
      <p class="lede">{$t.home.lede}</p>

      <div class="hero-actions">
        <a class="primary-action" href={$link('/ship')}
          ><span>{$t.home.exploreShip}</span><i aria-hidden="true"
            ><MangaIcon name="arrowUpRight" /></i
          ></a
        >
        <a class="ghost-action" href={$link('/tour')}
          ><span>{$t.home.walkTheShip}</span><i aria-hidden="true"
            ><MangaIcon name="arrowUpRight" /></i
          ></a
        >
      </div>

      {#if data.latestChapter}
        <a class="latest-record" href={$link('/timeline')}>
          <span class="record-label">{$t.home.latestChapter}</span>
          <span class="record-body">
            <strong>{data.latestChapter.number} · {data.latestChapter.title}</strong>
            <small>{$t.home.published(formatDate(data.latestChapter.date))}</small>
          </span>
        </a>
      {/if}

      <p class="latest-record living-record">
        <span class="record-label">{$t.home.living.label}</span>
        <span class="record-body">
          <strong>{$t.home.living.count(data.living.alive, data.living.total)}</strong>
          <small
            >{data.living.asOfChapter === null
              ? $t.home.living.latest
              : $t.home.living.asOf(data.living.asOfChapter)}{data.living.unknown
              ? ` · ${$t.home.living.unknown(data.living.unknown)}`
              : ''}</small
          >
        </span>
      </p>
    </div>

    <div class="ship-visual">
      <div class="voyage-bleed"><BlackWhaleVoyage /></div>
    </div>
  </section>

  <section class="manifest" aria-label={$t.layout.archiveSections}>
    <div class="dossier-grid">
      {#each dossiers as dossier (dossier.href)}
        <a href={$link(dossier.href)} class="dossier-card">
          <h2>{dossier.title}</h2>
          <p>{dossier.copy}</p>
          <span class="directory-arrow" aria-hidden="true"><MangaIcon name="arrowRight" /></span>
        </a>
      {/each}
    </div>
  </section>
</div>

<style>
  .home-page {
    max-width: 1280px;
    margin: auto;
    padding: 0 var(--page-gutter) 4rem;
  }
  .hero {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    gap: 3rem;
    padding: clamp(2.5rem, 6vw, 5rem) 0 3rem;
  }
  .archive-label {
    margin: 0 0 0.75rem;
    color: var(--text-secondary);
    font-size: 0.8rem;
  }
  h1 {
    margin: 0;
    font-size: clamp(3.5rem, 6vw, 5.5rem);
    font-weight: 400;
    line-height: 1.15;
    letter-spacing: -0.025em;
  }
  .lede {
    max-width: 34rem;
    margin: 1.25rem 0 0;
    color: var(--text-secondary);
    font-size: 1rem;
    line-height: 1.8;
  }
  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem 1.5rem;
    margin-top: 1.75rem;
  }
  .hero-actions a {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    gap: 1rem;
    font-size: 0.85rem;
    text-decoration: none;
  }
  .primary-action {
    padding: 0.7rem 1rem;
    border-radius: 3px;
    background: var(--accent-gold);
    color: var(--surface-void);
    font-weight: 600;
  }
  .primary-action:hover {
    background: var(--accent-gold-bright);
  }
  .ghost-action {
    color: var(--text-secondary);
  }
  .ghost-action:hover {
    color: var(--text-primary);
  }
  .hero-actions i {
    font-style: normal;
  }
  .latest-record {
    display: grid;
    gap: 0.4rem;
    margin-top: 2rem;
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 0.75rem;
  }
  .living-record {
    margin: 1rem 0 0;
  }
  .record-label {
    color: var(--text-muted);
  }
  .record-body {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 1rem;
    align-items: baseline;
  }
  .record-body strong {
    font-weight: 500;
    color: var(--text-primary);
  }
  .record-body small {
    font-size: inherit;
    color: var(--text-muted);
  }
  .ship-visual {
    min-width: 0;
  }
  .dossier-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2rem;
    border-top: 1px solid var(--line-default);
    padding-top: 1.75rem;
  }
  .dossier-card {
    position: relative;
    padding-right: 2rem;
    color: inherit;
    text-decoration: none;
  }
  .dossier-card h2 {
    margin: 0;
    font: 500 1.05rem/1.5 var(--font-sans);
  }
  .dossier-card p {
    max-width: 32rem;
    margin: 0.6rem 0 0;
    color: var(--text-secondary);
    font-size: 0.85rem;
    line-height: 1.7;
  }
  .directory-arrow {
    position: absolute;
    right: 0;
    top: 0.25rem;
    color: var(--text-muted);
  }
  .dossier-card:hover h2,
  .dossier-card:hover .directory-arrow {
    color: var(--accent-gold-bright);
  }
  @media (max-width: 800px) {
    .hero {
      grid-template-columns: 1fr;
      gap: 2rem;
      padding-top: 2.5rem;
    }
    .hero-copy {
      max-width: 38rem;
    }
    .dossier-grid {
      grid-template-columns: 1fr;
      gap: 1.75rem;
    }
  }
</style>
