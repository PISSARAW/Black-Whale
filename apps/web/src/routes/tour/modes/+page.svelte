<script lang="ts">
  import Seo from '$lib/components/Seo.svelte'
  import { link, t } from '$lib/i18n'
  import { breadcrumbSchema } from '$lib/seo/schema'

  const modes = $derived([
    { key: 'free', href: '/tour', number: '01', accent: '#FFD700', copy: $t.tour.modes.free },
    {
      key: 'morena',
      href: '/tour/morena',
      number: '02',
      accent: '#d94f68',
      copy: $t.tour.modes.morena,
    },
    {
      key: 'reconstruction',
      href: '/reconstruction',
      number: '03',
      accent: '#79b8ff',
      copy: $t.tour.modes.reconstruction,
    },
    {
      key: 'infiltration',
      href: '/infiltration',
      number: '04',
      accent: '#6ee7b7',
      copy: $t.tour.modes.infiltration,
    },
    { key: 'hunt', href: '/hunt', number: '05', accent: '#fb923c', copy: $t.tour.modes.hunt },
    { key: 'arena', href: '/arena', number: '06', accent: '#ef4444', copy: $t.tour.modes.arena },
    {
      key: 'investigation',
      href: '/investigation',
      number: '07',
      accent: '#c4b5fd',
      copy: $t.tour.modes.investigation,
    },
    {
      key: 'strategy',
      href: '/strategy',
      number: '08',
      accent: '#facc15',
      copy: $t.tour.modes.strategy,
    },
  ])
</script>

<Seo
  title={$t.tour.modes.seoTitle}
  description={$t.tour.modes.seoDescription}
  jsonLd={breadcrumbSchema([
    { name: $t.common.home, path: $link('/') },
    { name: $t.nav.virtualTour, path: $link('/tour') },
    { name: $t.nav.tourModes, path: $link('/tour/modes') },
  ])}
/>

<main class="modes-shell">
  <header>
    <nav aria-label="Breadcrumb" class="breadcrumb">
      <a href={$link('/tour')}>{$t.nav.virtualTour}</a><span>/</span><span>{$t.nav.tourModes}</span>
    </nav>
    <h1>{$t.tour.modes.title}</h1>
    <p class="intro">{$t.tour.modes.intro}</p>
  </header>

  <section class="mode-grid" aria-label={$t.nav.tourModes}>
    {#each modes as mode (mode.key)}
      <a class="mode-card" href={$link(mode.href)}>
        <span class="tag">{mode.copy.tag}</span>
        <h2>{mode.copy.title}</h2>
        <p>{mode.copy.description}</p>
        <span class="action">{$t.tour.modes.open}<span aria-hidden="true"> →</span></span>
      </a>
    {/each}
  </section>
</main>

<style>
  .modes-shell {
    max-width: 1280px;
    margin: auto;
    padding: clamp(2rem, 4vw, 3.5rem) var(--page-gutter) 5rem;
  }
  header {
    margin-bottom: 2.5rem;
  }
  .breadcrumb {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-bottom: 1.5rem;
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  .breadcrumb a {
    color: var(--text-secondary);
    text-decoration: none;
  }
  h1 {
    margin: 0;
    font-size: clamp(2.5rem, 5vw, 3.5rem);
    font-weight: 500;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  .intro {
    max-width: 48rem;
    margin-top: 0.8rem;
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.75;
  }
  .mode-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 3rem;
  }
  .mode-card {
    display: flex;
    flex-direction: column;
    align-items: start;
    min-width: 0;
    padding: 1.5rem 0;
    border-top: 1px solid var(--line-default);
    text-decoration: none;
  }
  .tag {
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  h2 {
    margin: 0.5rem 0;
    font: 500 1.1rem/1.5 var(--font-sans);
  }
  .mode-card p {
    margin: 0 0 0.75rem;
    color: var(--text-secondary);
    font-size: 0.85rem;
    line-height: 1.75;
  }
  .action {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    gap: 1rem;
    color: var(--accent-gold-bright);
    font-size: 0.8rem;
  }
  .mode-card:hover h2 {
    color: var(--accent-gold-bright);
  }
  @media (max-width: 700px) {
    .mode-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
