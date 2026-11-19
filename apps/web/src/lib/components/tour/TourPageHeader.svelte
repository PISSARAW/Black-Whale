<script lang="ts">
  import { link, t } from '$lib/i18n'
  import { tourWords } from '$lib/tour/workspaceWords'
  interface Props {
    title: string
    intro: string
    counts: string
    scale: string
    morenaTitle: string
    morenaHref: string
    modesTitle: string
    modesHref: string
  }

  let { title, intro, counts, scale, morenaTitle, morenaHref, modesTitle, modesHref }: Props =
    $props()
</script>

<header class="archive-page-heading tour-heading">
  <div>
    <h1>{title}</h1>
    <p class="tour-hint">{$tourWords.hint}</p>
  </div>
  <div class="tour-heading-actions">
    <a class="clash-link" href={$link('/fighting')}>{$t.tour.modes.clash.play}</a>
    <details class="about-visit">
      <summary>{$tourWords.about}</summary>
      <div class="about-content">
        <p>{intro}</p>
        <p class="tour-counts">{counts} · {scale}</p>
        <nav aria-label={modesTitle}>
          <a href={modesHref}>{modesTitle} <span aria-hidden="true">→</span></a>
          <a href={morenaHref}>{morenaTitle} <span aria-hidden="true">→</span></a>
        </nav>
      </div>
    </details>
  </div>
</header>

<style>
  .tour-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem 2rem;
    max-width: 1800px;
    margin: auto;
    padding: 1.5rem var(--page-gutter) 0.6rem;
  }
  .tour-heading p {
    max-width: 46rem;
    margin: 0.4rem 0 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.5;
  }
  .tour-heading .tour-counts {
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  h1 {
    font-size: clamp(1.5rem, 3vw, 2.25rem);
  }
  .tour-heading-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem 1.5rem;
  }
  .clash-link {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0.6rem 0.9rem;
    border: 1px solid var(--accent-gold);
    border-radius: 4px;
    color: var(--accent-gold-bright);
    font-size: 0.8rem;
    text-decoration: none;
  }
  .clash-link:hover {
    background: rgb(255 215 0 / 8%);
  }
  .about-visit {
    position: relative;
  }
  summary {
    min-height: 44px;
    padding: 0.75rem 0;
    cursor: pointer;
    font-size: 0.75rem;
    color: var(--text-muted);
  }
  .about-content {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 50;
    width: min(460px, 85vw);
    padding: 1rem;
    border: 1px solid var(--line-default);
    border-radius: 5px;
    background: #111216;
    box-shadow: 0 10px 40px #0008;
  }
  @media (max-width: 600px) {
    .tour-heading {
      gap: 0;
      padding-top: 1rem;
    }
    .tour-hint {
      display: none;
    }
    .about-visit {
      margin-left: auto;
    }
  }
  nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0 1.5rem;
  }
  nav a {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    gap: 0.75rem;
    color: var(--text-secondary);
    font-size: 0.8rem;
    text-decoration: none;
  }
  nav a:hover {
    color: var(--accent-gold-bright);
  }
</style>
