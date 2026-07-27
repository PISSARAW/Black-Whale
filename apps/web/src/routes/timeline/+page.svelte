<script lang="ts">
  import type { PageData } from './$types'
  import VoyageProgress from '$lib/components/VoyageProgress.svelte'
  import { formatVoyageTime, voyageTimeForEvent } from '$lib/voyageTime'
  import Seo from '$lib/components/Seo.svelte'
  import { breadcrumbSchema } from '$lib/seo/schema'

  let { data }: { data: PageData } = $props()
  let query = $state('')
  let scrollProgress = $state(0)
  let searchInput: HTMLInputElement

  function updateScrollProgress() {
    const available = document.documentElement.scrollHeight - window.innerHeight
    scrollProgress = available > 0 ? Math.min(1, window.scrollY / available) : 0
  }

  function handleShortcut(event: KeyboardEvent) {
    if (event.key === '/' && document.activeElement?.tagName !== 'INPUT') {
      event.preventDefault()
      searchInput?.focus()
    }
  }

  let normalizedQuery = $derived(
    query
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase(),
  )

  let chapters = $derived(
    data.chapters
      .map((chapter) => ({
        ...chapter,
        events: chapter.events.filter((event) => {
          if (!normalizedQuery) return true
          return `${chapter.number} ${chapter.title || ''} ${event.title} ${event.summary}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .includes(normalizedQuery)
        }),
      }))
      .filter((chapter) => chapter.events.length > 0),
  )

  let eventCount = $derived(
    data.chapters.reduce((total, chapter) => total + chapter.events.length, 0),
  )
  let visibleEventCount = $derived(
    chapters.reduce((total, chapter) => total + chapter.events.length, 0),
  )
</script>

<svelte:window
  onscroll={updateScrollProgress}
  onresize={updateScrollProgress}
  onkeydown={handleShortcut}
/>

<Seo
  title="Succession War Timeline"
  description="An interactive chapter-by-chapter timeline of the Succession War arc: every confrontation, alliance and Nen transfer in canonical order."
  jsonLd={breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Timeline', path: '/timeline' },
  ])}
/>

<div class="timeline-page">
  <div class="reading-progress" aria-hidden="true">
    <span style:transform={`scaleX(${scrollProgress})`}></span>
  </div>
  <header class="hero">
    <div class="hero-copy">
      <p class="eyebrow">Narrative dossier · Succession War</p>
      <h1>Timeline</h1>
      <p class="intro">
        Follow the Black Whale events in canonical order and open the map at any point in the story.
      </p>
    </div>

    <dl class="stats" aria-label="Timeline summary">
      <div>
        <dt>Chapters</dt>
        <dd>{data.chapters.length}</dd>
      </div>
      <div>
        <dt>Events</dt>
        <dd>{eventCount}</dd>
      </div>
      <div>
        <dt>Latest record</dt>
        <dd>{data.chapters.at(-1)?.number ?? '—'}</dd>
      </div>
    </dl>
  </header>

  <div class="voyage-overview"><VoyageProgress compact /></div>

  <div class="toolbar">
    <label class="search-field">
      <span class="sr-only">Search the timeline</span>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5"></circle>
        <path d="m16 16 4 4"></path>
      </svg>
      <input
        bind:this={searchInput}
        bind:value={query}
        type="search"
        placeholder="Search by event, chapter, or keyword…"
      />
      <kbd>/</kbd>
      {#if query}
        <button type="button" onclick={() => (query = '')} aria-label="Clear search">×</button>
      {/if}
    </label>

    {#if data.spoilerLimit}
      <div class="spoiler-badge" title="Later events are hidden">
        <span aria-hidden="true">◉</span>
        Spoilers limited to chapter {data.spoilerLimit}
      </div>
    {:else}
      <div class="canon-badge"><span aria-hidden="true">●</span> Full canon</div>
    {/if}
  </div>

  <div class="timeline-layout">
    <aside aria-label="Quick chapter access">
      <p>Index</p>
      <nav>
        {#each data.chapters as chapter (chapter.id)}
          <a href="#chapter-{chapter.number}">
            <span>CH.</span>
            <strong>{chapter.number}</strong>
          </a>
        {/each}
      </nav>
    </aside>

    <main class="timeline" aria-live="polite">
      {#each chapters as chapter, chapterIndex (chapter.id)}
        <section id="chapter-{chapter.number}" class="chapter reveal-on-scroll">
          <div class="rail" aria-hidden="true">
            <span class="chapter-dot"></span>
            {#if chapterIndex < chapters.length - 1}<span class="line"></span>{/if}
          </div>

          <div class="chapter-content">
            <header class="chapter-header">
              <div>
                <p>Chapter {chapter.number}</p>
                <h2>{chapter.title || 'Untitled'}</h2>
              </div>
              <span>{chapter.events.length} {chapter.events.length === 1 ? 'event' : 'events'}</span
              >
            </header>

            <ol class="events">
              {#each chapter.events as event, eventIndex (event.id)}
                {@const voyageTime = voyageTimeForEvent(chapter.number, event.title)}
                <li>
                  <a href="/ship?eventId={event.id}" aria-label="{event.title} — open on the map">
                    <span class="event-index">{String(eventIndex + 1).padStart(2, '0')}</span>
                    <span class="event-copy">
                      {#if event.isFlashback}<span class="event-time flashback"
                          >↶ Flashback · occurrence #{event.ordinal}</span
                        >{/if}
                      {#if event.occurredAtLabel}<span class="event-time"
                          >{event.occurredAtLabel}</span
                        >
                      {:else if voyageTime}<span
                          class:approximate={voyageTime.precision === 'approximate'}
                          class="event-time">{formatVoyageTime(voyageTime)}</span
                        >{/if}
                      <span class="event-title">{event.title}</span>
                      <span class="event-summary">{event.summary}</span>
                    </span>
                    <span class="event-action">
                      <span>Seq. {event.sequence}</span>
                      <svg viewBox="0 0 24 24" aria-hidden="true"
                        ><path d="m9 18 6-6-6-6"></path></svg
                      >
                    </span>
                  </a>
                </li>
              {/each}
            </ol>
          </div>
        </section>
      {/each}

      {#if chapters.length === 0}
        <div class="empty-state">
          <span aria-hidden="true">⌁</span>
          <h2>No events found</h2>
          <p>Try another title, chapter number, or keyword.</p>
          <button type="button" onclick={() => (query = '')}>Reset search</button>
        </div>
      {:else if normalizedQuery}
        <p class="results-count">
          {visibleEventCount} of {eventCount} result{visibleEventCount === 1 ? '' : 's'}
        </p>
      {/if}
    </main>
  </div>
</div>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }

  .timeline-page {
    min-height: calc(100vh - 3.25rem);
    padding: clamp(2rem, 5vw, 5rem) clamp(1rem, 4vw, 4rem) 6rem;
    color: var(--ink);
  }

  .reading-progress {
    position: fixed;
    z-index: 90;
    top: var(--header-height);
    right: 0;
    left: 0;
    height: 2px;
    pointer-events: none;
  }
  .reading-progress span {
    display: block;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, var(--accent-cyan), var(--accent-gold));
    box-shadow: 0 0 12px var(--accent-gold-glow);
    transform-origin: left;
  }

  .hero {
    display: flex;
    max-width: 1180px;
    margin: 0 auto 2rem;
    align-items: end;
    justify-content: space-between;
    gap: 2rem;
  }

  .hero-copy {
    max-width: 690px;
  }
  .eyebrow,
  aside > p,
  .chapter-header p {
    margin: 0 0 0.55rem;
    color: #c9a44a;
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    color: #f2efe3;
    font-size: clamp(3rem, 8vw, 6.2rem);
    font-weight: 600;
    letter-spacing: -0.055em;
    line-height: 0.88;
  }

  .intro {
    max-width: 620px;
    margin: 1.25rem 0 0;
    color: #9ba8aa;
    font-size: clamp(0.95rem, 1.4vw, 1.08rem);
    line-height: 1.65;
  }
  .voyage-overview {
    max-width: 1180px;
    margin: 0 auto 1rem;
  }

  .stats {
    display: flex;
    flex: none;
    margin: 0;
    gap: 1px;
    overflow: hidden;
    border: 1px solid rgba(134, 156, 162, 0.22);
    border-radius: 0.7rem;
    background: rgba(134, 156, 162, 0.18);
  }
  .stats div {
    min-width: 105px;
    padding: 0.85rem 1rem;
    background: rgba(9, 16, 23, 0.88);
  }
  .stats dt {
    color: #70817f;
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .stats dd {
    margin: 0.2rem 0 0;
    color: #e6dfc8;
    font:
      600 1.35rem/1 'IBM Plex Sans Condensed',
      sans-serif;
  }

  .toolbar {
    display: flex;
    position: sticky;
    z-index: 20;
    top: 0.75rem;
    max-width: 1180px;
    margin: 0 auto 2.4rem;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.65rem;
    border: 1px solid rgba(105, 128, 137, 0.24);
    border-radius: 0.8rem;
    background: rgba(8, 14, 20, 0.88);
    box-shadow: 0 16px 38px rgba(0, 0, 0, 0.22);
    backdrop-filter: blur(16px);
  }
  .search-field {
    display: flex;
    min-width: min(480px, 100%);
    align-items: center;
    gap: 0.65rem;
    padding: 0.25rem 0.55rem;
  }
  .search-field svg {
    width: 1rem;
    fill: none;
    stroke: #718587;
    stroke-width: 1.7;
  }
  .search-field input {
    width: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: #eef0e8;
    font: inherit;
    font-size: 0.82rem;
  }
  .search-field input::placeholder {
    color: #657174;
  }
  .search-field button {
    border: 0;
    background: none;
    color: #94a3a4;
    cursor: pointer;
    font-size: 1.2rem;
  }
  .search-field kbd {
    padding: 0.2rem 0.32rem;
    border: 1px solid var(--line-default);
    border-radius: 0.25rem;
    color: var(--text-faint);
    font: 0.5rem/1 var(--font-mono);
  }
  .spoiler-badge,
  .canon-badge {
    display: flex;
    flex: none;
    align-items: center;
    gap: 0.45rem;
    padding: 0.45rem 0.7rem;
    border-radius: 0.45rem;
    font-size: 0.68rem;
  }
  .spoiler-badge {
    color: #e7a69f;
    background: rgba(124, 41, 38, 0.18);
  }
  .canon-badge {
    color: #91c9bc;
    background: rgba(34, 104, 87, 0.16);
  }
  .canon-badge span {
    font-size: 0.45rem;
  }

  .timeline-layout {
    display: grid;
    max-width: 1180px;
    margin: 0 auto;
    grid-template-columns: 76px minmax(0, 1fr);
    gap: clamp(1.5rem, 4vw, 4rem);
  }
  aside {
    position: sticky;
    top: 6.5rem;
    height: fit-content;
  }
  aside nav {
    display: grid;
    gap: 0.35rem;
  }
  aside a {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
    padding: 0.38rem 0.45rem;
    border-left: 1px solid #2b3a43;
    color: #7f8f91;
    text-decoration: none;
    transition: 0.18s ease;
  }
  aside a span {
    font-size: 0.5rem;
    letter-spacing: 0.08em;
  }
  aside a strong {
    font:
      500 0.78rem/1 'IBM Plex Sans Condensed',
      sans-serif;
  }
  aside a:hover {
    border-color: #c9a44a;
    color: #e3c66f;
    background: rgba(201, 164, 74, 0.05);
  }

  .timeline {
    min-width: 0;
  }
  .chapter {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr);
    gap: clamp(1rem, 2.5vw, 2rem);
    scroll-margin-top: 7rem;
  }
  .rail {
    display: flex;
    align-items: center;
    flex-direction: column;
  }
  .chapter-dot {
    width: 13px;
    height: 13px;
    flex: none;
    margin-top: 0.45rem;
    border: 3px solid #071019;
    border-radius: 50%;
    background: #c9a44a;
    box-shadow:
      0 0 0 1px rgba(201, 164, 74, 0.65),
      0 0 18px rgba(201, 164, 74, 0.18);
  }
  .line {
    width: 1px;
    height: 100%;
    min-height: 5rem;
    background: linear-gradient(#4c5552, rgba(48, 64, 70, 0.25));
  }
  .chapter-content {
    padding-bottom: clamp(3rem, 7vw, 6rem);
  }
  .chapter-header {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .chapter-header h2 {
    margin: 0;
    color: #eff0e8;
    font-size: clamp(1.65rem, 3vw, 2.35rem);
    font-weight: 500;
    line-height: 1;
  }
  .chapter-header > span {
    color: #647476;
    font-size: 0.68rem;
    white-space: nowrap;
  }

  .events {
    display: grid;
    gap: 0.6rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .events a {
    display: grid;
    position: relative;
    overflow: hidden;
    grid-template-columns: 42px minmax(0, 1fr) auto;
    align-items: center;
    gap: 1rem;
    padding: 1.15rem 1.2rem;
    border: 1px solid rgba(91, 112, 120, 0.24);
    border-radius: 0.68rem;
    background: linear-gradient(110deg, rgba(17, 25, 36, 0.88), rgba(10, 18, 26, 0.76));
    color: inherit;
    text-decoration: none;
    transition:
      border-color 0.2s ease,
      transform 0.2s ease,
      background 0.2s ease;
  }
  .events a::before {
    position: absolute;
    inset: 0 auto 0 0;
    width: 2px;
    background: #c9a44a;
    content: '';
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .events a:hover {
    transform: translateX(4px);
    border-color: rgba(201, 164, 74, 0.38);
    background: linear-gradient(110deg, rgba(25, 32, 39, 0.96), rgba(12, 23, 32, 0.88));
  }
  .events a:hover::before {
    opacity: 1;
  }
  .event-index {
    color: #536366;
    font:
      500 0.7rem/1 'IBM Plex Sans Condensed',
      sans-serif;
    letter-spacing: 0.08em;
  }
  .event-copy {
    display: grid;
    gap: 0.32rem;
    min-width: 0;
  }
  .event-time {
    width: fit-content;
    padding: 0.18rem 0.36rem;
    border: 1px solid rgba(112, 189, 193, 0.24);
    border-radius: 0.25rem;
    background: rgba(112, 189, 193, 0.07);
    color: #8fc9ca;
    font: 600 0.49rem/1 var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .event-time.approximate {
    border-color: rgba(201, 164, 74, 0.22);
    background: rgba(201, 164, 74, 0.06);
    color: #c9ad66;
  }
  .event-time.flashback {
    border-color: rgba(173, 139, 234, 0.35);
    background: rgba(173, 139, 234, 0.09);
    color: #c4a8f2;
  }
  .event-title {
    color: #e7e8e1;
    font:
      600 1.02rem/1.25 'IBM Plex Sans Condensed',
      sans-serif;
  }
  .event-summary {
    color: #8d9a9d;
    font-size: 0.78rem;
    line-height: 1.5;
  }
  .event-action {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    color: #667779;
    font-size: 0.58rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .event-action svg {
    width: 1rem;
    fill: none;
    stroke: #b79a4e;
    stroke-width: 1.7;
    transition: transform 0.2s ease;
  }
  .events a:hover .event-action svg {
    transform: translateX(3px);
  }

  .empty-state {
    padding: 5rem 1rem;
    border: 1px dashed rgba(105, 128, 137, 0.3);
    border-radius: 0.8rem;
    text-align: center;
  }
  .empty-state > span {
    color: #c9a44a;
    font-size: 2rem;
  }
  .empty-state h2 {
    margin: 0.7rem 0 0.25rem;
    color: #e5e7df;
  }
  .empty-state p,
  .results-count {
    color: #738184;
    font-size: 0.78rem;
  }
  .empty-state button {
    margin-top: 1rem;
    padding: 0.55rem 0.8rem;
    border: 1px solid rgba(201, 164, 74, 0.35);
    border-radius: 0.4rem;
    background: rgba(201, 164, 74, 0.08);
    color: #ddc273;
    cursor: pointer;
  }
  .results-count {
    margin: -3.5rem 0 0 60px;
  }

  @media (max-width: 820px) {
    .hero {
      align-items: start;
      flex-direction: column;
    }
    .stats {
      width: 100%;
    }
    .stats div {
      min-width: 0;
      flex: 1;
    }
    .toolbar {
      top: 0.5rem;
    }
  }

  @media (max-width: 620px) {
    .timeline-page {
      padding-inline: 0.8rem;
    }
    .toolbar {
      align-items: stretch;
      flex-direction: column;
    }
    .spoiler-badge,
    .canon-badge {
      width: fit-content;
    }
    .timeline-layout {
      grid-template-columns: 1fr;
    }
    aside {
      display: none;
    }
    .chapter {
      grid-template-columns: 18px minmax(0, 1fr);
      gap: 0.65rem;
    }
    .events a {
      grid-template-columns: minmax(0, 1fr) auto;
      padding: 1rem;
    }
    .event-index {
      display: none;
    }
    .event-action > span {
      display: none;
    }
    .event-summary {
      font-size: 0.74rem;
    }
    .stats div {
      padding: 0.7rem;
    }
    .stats dt {
      font-size: 0.5rem;
    }
    .stats dd {
      font-size: 1.1rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :global(html) {
      scroll-behavior: auto;
    }
    .events a,
    .event-action svg {
      transition: none;
    }
  }
</style>
