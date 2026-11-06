<script lang="ts">
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
    <p>{intro}</p>
    <p class="tour-counts">{counts} · {scale}</p>
  </div>
  <nav aria-label={modesTitle}>
    <a href={modesHref}>{modesTitle} <span aria-hidden="true">→</span></a>
    <a href={morenaHref}>{morenaTitle} <span aria-hidden="true">→</span></a>
  </nav>
</header>

<style>
  .tour-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    justify-content: space-between;
    gap: 1rem 2rem;
    max-width: 1600px;
    margin: auto;
    padding: clamp(2rem, 4vw, 3.5rem) var(--page-gutter) 1.5rem;
  }
  .tour-heading p {
    max-width: 46rem;
    margin: 0.8rem 0 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.75;
  }
  .tour-heading .tour-counts {
    color: var(--text-muted);
    font-size: 0.75rem;
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
