<script lang="ts">
  import type { PageData } from './$types'
  import BlackWhaleVoyage from '$lib/components/home/BlackWhaleVoyage.svelte'
  import VoyageProgress from '$lib/components/VoyageProgress.svelte'
  import Seo from '$lib/components/Seo.svelte'
  import { websiteSchema } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'
  import { LOCALE_TAGS } from '$lib/i18n/config'
  import { PUBLIC_FEATURES } from '$lib/config/features'

  let { data }: { data: PageData } = $props()

  const pad = (value: number) => (value < 10 ? `0${value}` : String(value))

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

  let metrics = $derived([
    { value: pad(data.metrics.tiers), label: $t.home.metrics.tiers },
    { value: String(data.metrics.passengers), label: $t.home.metrics.passengers },
    { value: String(data.metrics.rooms), label: $t.home.metrics.rooms },
    { value: String(data.metrics.abilities), label: $t.home.metrics.abilities },
  ])

  let dossiers = $derived([
    { index: '01', href: '/ship', ...$t.home.dossiers.ship },
    { index: '02', href: '/timeline', ...$t.home.dossiers.timeline },
    ...(PUBLIC_FEATURES.perspectives
      ? [{ index: '03', href: '/perspectives', ...$t.home.dossiers.perspectives }]
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
      <p class="eyebrow">{$t.home.eyebrow}</p>
      <h1><span>{$t.home.titleLead}</span> {$t.home.titleBrand}</h1>
      <p class="lede">{$t.home.lede}</p>

      <div class="hero-actions">
        <a class="primary-action" href={$link('/ship')}
          ><span>{$t.home.exploreShip}</span><i aria-hidden="true">↗</i></a
        >
        <!-- The deck plans and the walk are two readings of one reconstruction,
             so the hero offers both rather than burying the tour in the nav. -->
        <a class="ghost-action" href={$link('/tour')}
          ><span>{$t.home.walkTheShip}</span><i aria-hidden="true">↗</i></a
        >
        <a class="secondary-action" href={$link('/characters')}>{$t.home.openRegistry}</a>
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
    </div>

    <div class="ship-visual">
      <div class="voyage-bleed"><BlackWhaleVoyage /></div>
      <VoyageProgress />
    </div>
  </section>

  <section class="metrics reveal-on-scroll" aria-label={$t.home.metricsLabel}>
    {#each metrics as metric (metric.label)}
      <div>
        <span>{metric.value}</span>
        <p>{metric.label}</p>
      </div>
    {/each}
  </section>

  <section class="manifest reveal-on-scroll">
    <header>
      <div>
        <p class="eyebrow">{$t.home.manifestEyebrow}</p>
        <h2>{$t.home.manifestTitleLine1}<br />{$t.home.manifestTitleLine2}</h2>
      </div>
      <p>{$t.home.manifestCopy}</p>
    </header>

    <div class="dossier-grid">
      {#each dossiers as dossier (dossier.index)}
        <a href={$link(dossier.href)} class="dossier-card">
          <span class="index">{dossier.index}</span>
          <span class="tag">{dossier.tag}</span>
          <h3>{dossier.title}</h3>
          <p>{dossier.copy}</p>
          <i aria-hidden="true">{$t.home.dossierExplore}</i>
        </a>
      {/each}
    </div>
  </section>

  <section class="closing reveal-on-scroll">
    <p class="eyebrow">{$t.home.closingEyebrow}</p>
    <h2>{$t.home.closingTitleLine1}<br />{$t.home.closingTitleLine2}</h2>
    <a href={$link('/timeline')}>{$t.home.openTimeline} <span>→</span></a>
  </section>
</div>

<style>
  .home-page {
    overflow: hidden;
  }
  .hero {
    position: relative;
    display: grid;
    min-height: calc(100svh - var(--header-height));
    grid-template-columns: minmax(0, 0.9fr) minmax(30rem, 1.1fr);
    align-items: center;
    gap: clamp(2rem, 6vw, 7rem);
    padding: clamp(3rem, 7vw, 7rem) var(--page-gutter);
  }
  .hero::before {
    position: absolute;
    top: 12%;
    bottom: 12%;
    left: 50%;
    width: 1px;
    background: linear-gradient(transparent, var(--line-default), transparent);
    content: '';
    opacity: 0.5;
  }
  .hero-copy {
    position: relative;
    z-index: 2;
    max-width: 42rem;
  }
  h1 {
    margin: 0.8rem 0 1.4rem;
    font-size: clamp(4.4rem, 9.4vw, 9rem);
    font-weight: 500;
    letter-spacing: -0.06em;
    line-height: 0.72;
    text-transform: uppercase;
  }
  h1 span {
    display: block;
    color: var(--text-muted);
    font-size: 0.32em;
    font-weight: 400;
    letter-spacing: 0.04em;
    line-height: 1.15;
  }
  .lede {
    max-width: 37rem;
    color: var(--text-secondary);
    font-size: clamp(0.95rem, 1.4vw, 1.12rem);
    line-height: 1.75;
  }
  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.7rem 1.2rem;
    margin-top: 2.2rem;
  }
  .hero-actions a {
    text-decoration: none;
  }
  .primary-action {
    display: flex;
    min-width: 13rem;
    justify-content: space-between;
    gap: 2rem;
    padding: 0.9rem 1rem;
    border: 1px solid var(--accent-gold);
    border-radius: 0.35rem;
    background: var(--accent-gold);
    color: #091014;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    transition:
      transform 0.25s var(--ease-out),
      box-shadow 0.25s;
  }
  .primary-action:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 35px rgba(200, 169, 86, 0.2);
  }
  .primary-action i {
    font-style: normal;
  }
  /* The same button, unfilled: a second way in, not a second first choice. */
  .ghost-action {
    display: flex;
    min-width: 13rem;
    justify-content: space-between;
    gap: 2rem;
    padding: 0.9rem 1rem;
    border: 1px solid var(--accent-gold);
    border-radius: 0.35rem;
    color: var(--accent-gold-bright);
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    transition:
      transform 0.25s var(--ease-out),
      background 0.25s,
      box-shadow 0.25s;
  }
  .ghost-action:hover {
    transform: translateY(-3px);
    background: rgba(200, 169, 86, 0.12);
    box-shadow: 0 14px 35px rgba(200, 169, 86, 0.12);
  }
  .ghost-action i {
    font-style: normal;
  }
  .secondary-action {
    padding: 0.8rem 0.25rem;
    border-bottom: 1px solid var(--line-strong);
    color: var(--text-secondary);
    font-size: 0.7rem;
  }
  .secondary-action:hover {
    color: var(--text-primary);
  }
  .latest-record {
    display: inline-grid;
    margin-top: 3.3rem;
    gap: 0.3rem;
    padding-left: 0.9rem;
    border-left: 1px solid var(--line-strong);
    color: var(--text-muted);
    text-decoration: none;
  }
  .record-label {
    color: var(--text-faint);
    font: 0.5rem/1.2 var(--font-mono);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
  }
  .latest-record strong {
    color: var(--text-secondary);
    font: 600 0.72rem/1.2 var(--font-mono);
    transition: color var(--duration-fast) var(--ease-out);
  }
  .latest-record:hover strong {
    color: var(--accent-gold-bright);
  }
  .latest-record small {
    display: block;
    margin-top: 0.15rem;
    font: 0.5rem/1.2 var(--font-mono);
  }
  .ship-visual {
    position: relative;
    display: grid;
    width: min(51rem, 100%);
    justify-self: center;
    gap: 0.8rem;
  }
  .metrics {
    display: grid;
    max-width: var(--container-wide);
    margin: 0 auto;
    grid-template-columns: repeat(4, 1fr);
    padding: 0 var(--page-gutter);
  }
  .metrics div {
    display: flex;
    align-items: baseline;
    gap: 0.7rem;
    padding: 1.5rem;
    border-top: 1px solid var(--line-default);
    border-right: 1px solid var(--line-subtle);
  }
  .metrics div:last-child {
    border-right: 0;
  }
  .metrics span {
    color: var(--accent-gold-bright);
    font: 500 1.8rem/1 var(--font-display);
  }
  .metrics p {
    margin: 0;
    color: var(--text-muted);
    font: 0.55rem/1.2 var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .manifest {
    max-width: var(--container-wide);
    margin: 0 auto;
    padding: clamp(4.5rem, 8vw, 7.5rem) var(--page-gutter);
  }
  .manifest > header {
    display: grid;
    grid-template-columns: 1fr 0.65fr;
    align-items: end;
    gap: 3rem;
    margin-bottom: 4rem;
  }
  .manifest h2,
  .closing h2 {
    margin: 0.7rem 0 0;
    font-size: clamp(3.2rem, 7vw, 6.5rem);
    font-weight: 500;
    letter-spacing: -0.05em;
    line-height: 0.86;
    text-transform: uppercase;
  }
  .manifest > header > p {
    max-width: 31rem;
    margin: 0;
    color: var(--text-secondary);
    line-height: 1.7;
  }
  .dossier-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border-top: 1px solid var(--line-default);
  }
  /* The copy sits at the foot of the card and the index at its head; the space
     between them is whatever is left, rather than a fixed heading margin that
     leaves a dead band at the top. */
  .dossier-card {
    position: relative;
    display: flex;
    min-height: 19rem;
    flex-direction: column;
    padding: 1.5rem 1.5rem 4rem;
    border-right: 1px solid var(--line-default);
    color: inherit;
    text-decoration: none;
    transition:
      background 0.3s,
      transform 0.3s var(--ease-out);
  }
  .dossier-card:last-child {
    border-right: 0;
  }
  .dossier-card:hover {
    background: linear-gradient(rgba(200, 169, 86, 0.07), transparent);
    transform: translateY(-0.5rem);
  }
  .dossier-card .index,
  .dossier-card .tag {
    font: 0.56rem/1 var(--font-mono);
    letter-spacing: 0.12em;
  }
  .dossier-card .index {
    color: var(--text-faint);
  }
  .dossier-card .tag {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    color: var(--accent-gold);
  }
  .dossier-card h3 {
    max-width: 18rem;
    margin: auto 0 1rem;
    font-size: 2.2rem;
    line-height: 0.95;
    /* These titles are sentences, not labels: balancing keeps the second line
       from collapsing to a single orphaned word. */
    text-wrap: balance;
  }
  .dossier-card p {
    max-width: 19rem;
    color: var(--text-muted);
    font-size: 0.8rem;
    line-height: 1.65;
  }
  .dossier-card > i {
    position: absolute;
    bottom: 1.5rem;
    color: var(--text-secondary);
    font: normal 0.58rem/1 var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .closing {
    position: relative;
    padding: clamp(5rem, 9vw, 8.5rem) var(--page-gutter);
    border-top: 1px solid var(--line-subtle);
    text-align: center;
    background: radial-gradient(circle at 50% 60%, rgba(37, 83, 89, 0.18), transparent 42%);
  }
  .closing h2 {
    margin-inline: auto;
  }
  .closing a {
    display: inline-flex;
    align-items: center;
    gap: 1rem;
    margin-top: 2.5rem;
    padding-bottom: 0.55rem;
    border-bottom: 1px solid var(--accent-gold);
    color: var(--accent-gold-bright);
    font-size: 0.72rem;
    text-decoration: none;
    text-transform: uppercase;
  }
  .closing a span {
    transition: transform 0.2s;
  }
  .closing a:hover span {
    transform: translateX(0.4rem);
  }
  @media (max-width: 900px) {
    .hero {
      min-height: auto;
      grid-template-columns: 1fr;
      padding-top: 5rem;
    }
    .hero::before {
      display: none;
    }
    .ship-visual {
      width: min(100%, 38rem);
    }
    .manifest > header {
      grid-template-columns: 1fr;
    }
    .dossier-grid {
      grid-template-columns: 1fr;
    }
    .dossier-card {
      min-height: 15rem;
      border-right: 0;
      border-bottom: 1px solid var(--line-default);
    }
  }
  @media (max-width: 600px) {
    .hero {
      padding-inline: 1rem;
    }
    .hero h1 {
      font-size: clamp(4rem, 22vw, 6rem);
    }
    /* The illustration is allowed to run off the edge; the progress panel below
       it carries figures and must stay inside the viewport. */
    .voyage-bleed {
      width: 125%;
      margin-left: -12.5%;
      overflow: hidden;
    }
    .metrics {
      grid-template-columns: repeat(2, 1fr);
      padding-inline: 1rem;
    }
    .metrics div:nth-child(2) {
      border-right: 0;
    }
    .manifest {
      padding-inline: 1rem;
    }
  }
</style>
