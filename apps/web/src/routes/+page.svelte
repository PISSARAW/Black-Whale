<script lang="ts">
  import type { PageData } from './$types'
  import BlackWhaleVoyage from '$lib/components/home/BlackWhaleVoyage.svelte'
  import VoyageProgress from '$lib/components/VoyageProgress.svelte'
  import Seo from '$lib/components/Seo.svelte'
  import { websiteSchema } from '$lib/seo/schema'

  let { data }: { data: PageData } = $props()

  const pad = (value: number) => (value < 10 ? `0${value}` : String(value))

  // A fixed locale and time zone keep the server render and the hydrated
  // markup identical whatever the visitor's machine is set to.
  const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const formatDate = (value: string) => dateFormatter.format(new Date(value))

  let metrics = $derived([
    { value: pad(data.metrics.tiers), label: 'Ship tiers' },
    { value: String(data.metrics.passengers), label: 'Passengers catalogued' },
    { value: String(data.metrics.rooms), label: 'Rooms charted' },
    { value: String(data.metrics.abilities), label: 'Nen abilities' },
  ])

  const dossiers = [
    {
      index: '01',
      title: 'The ship, deck by deck',
      copy: 'Navigate five tiers and inspect who is where at any point in the voyage.',
      href: '/ship',
      tag: 'LIVE MAP',
    },
    {
      index: '02',
      title: 'Every event, in order',
      copy: 'Trace each confrontation, alliance, and transfer in narrative order.',
      href: '/timeline',
      tag: 'EVENT LOG',
    },
    {
      index: '03',
      title: 'What each character knows',
      copy: 'See the same world through different minds, memories, and assumptions.',
      href: '/perspectives',
      tag: 'KNOWLEDGE',
    },
  ]
</script>

<Seo
  description="Navigate the people, decks, knowledge and Nen systems of the Black Whale Succession War — an interactive Hunter × Hunter archive."
  jsonLd={websiteSchema()}
/>

<div class="home-page">
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">Kakin Royal Expedition · Voyage 001</p>
      <h1><span>Enter the</span> Black Whale</h1>
      <p class="lede">
        An archive of the Succession War arc. It records where every passenger is, which body holds
        which consciousness, what Nen is in play, and what each character believes at that moment of
        the voyage.
      </p>

      <div class="hero-actions">
        <a class="primary-action" href="/ship"
          ><span>Explore the ship</span><i aria-hidden="true">↗</i></a
        >
        <a class="secondary-action" href="/characters">Open passenger registry</a>
      </div>

      {#if data.latestChapter}
        <a class="latest-record" href="/timeline">
          <span class="record-label">Latest indexed chapter</span>
          <span class="record-body">
            <strong>{data.latestChapter.number} · {data.latestChapter.title}</strong>
            <small>Published {formatDate(data.latestChapter.date)}</small>
          </span>
        </a>
      {/if}
    </div>

    <div class="ship-visual"><BlackWhaleVoyage /><VoyageProgress /></div>

    <div class="hero-index" aria-hidden="true">001</div>
  </section>

  <section class="metrics reveal-on-scroll" aria-label="Archive metrics">
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
        <p class="eyebrow">Intelligence architecture</p>
        <h2>One voyage.<br />Many realities.</h2>
      </div>
      <p>
        The archive never treats information as absolute. Every record belongs to a time, a source,
        and a point of view.
      </p>
    </header>

    <div class="dossier-grid">
      {#each dossiers as dossier (dossier.index)}
        <a href={dossier.href} class="dossier-card">
          <span class="index">{dossier.index}</span>
          <span class="tag">{dossier.tag}</span>
          <h3>{dossier.title}</h3>
          <p>{dossier.copy}</p>
          <i aria-hidden="true">Explore ↗</i>
        </a>
      {/each}
    </div>
  </section>

  <section class="closing reveal-on-scroll">
    <p class="eyebrow">Where to begin</p>
    <h2>Start at the first<br />recorded event.</h2>
    <a href="/timeline">Open the timeline <span>→</span></a>
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
  .hero-index {
    position: absolute;
    right: 1.5rem;
    bottom: 1rem;
    color: rgba(240, 238, 230, 0.035);
    font: 500 clamp(8rem, 20vw, 18rem)/0.75 var(--font-display);
    pointer-events: none;
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
    padding: clamp(6rem, 12vw, 11rem) var(--page-gutter);
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
  .dossier-card {
    position: relative;
    min-height: 24rem;
    padding: 1.5rem;
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
    max-width: 16rem;
    margin: 7.5rem 0 1rem;
    font-size: 2.2rem;
    line-height: 0.95;
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
    padding: clamp(7rem, 14vw, 13rem) var(--page-gutter);
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
      min-height: 18rem;
      border-right: 0;
      border-bottom: 1px solid var(--line-default);
    }
    .dossier-card h3 {
      margin-top: 4.5rem;
    }
  }
  @media (max-width: 600px) {
    .hero {
      padding-inline: 1rem;
    }
    .hero h1 {
      font-size: clamp(4rem, 22vw, 6rem);
    }
    .ship-visual {
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
