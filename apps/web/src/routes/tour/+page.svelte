<script lang="ts">
  import Seo from '$lib/components/Seo.svelte'
  import { link, t } from '$lib/i18n'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  /**
   * The blueprint is several hundred kilobytes of source data followed by the
   * geometry code that indexes it. Keep both behind the interaction boundary:
   * the server can answer with the title and loading state, then the browser
   * asks for the walk only when this route is actually hydrated.
   */
  const experience = import('./TourPageExperience.svelte')
</script>

{#await experience}
  <Seo
    title={$t.tour.seoTitle}
    description={$t.tour.seoDescription}
    jsonLd={breadcrumbSchema([
      { name: $t.common.home, path: $link('/') },
      { name: $t.nav.virtualTour, path: $link('/tour') },
    ])}
  />

  <main class="tour-loading" aria-busy="true" aria-live="polite">
    <p class="eyebrow">{$t.nav.virtualTour}</p>
    <h1>{$t.tour.title}</h1>
    <p>{$t.tour.loading}</p>
  </main>
{:then module}
  {@const Experience = module.default}
  <Experience {data} />
{/await}

<style>
  .tour-loading {
    display: grid;
    min-height: 55vh;
    place-content: center;
    gap: 0.7rem;
    padding: 2rem;
    text-align: center;
  }

  .tour-loading h1,
  .tour-loading p {
    margin: 0;
  }

  .tour-loading h1 {
    color: var(--ivory, #fffff0);
    font-family: var(--font-display, serif);
    font-size: clamp(2rem, 6vw, 4rem);
  }

  .tour-loading p:not(.eyebrow) {
    color: rgb(255 255 240 / 0.65);
  }

  .eyebrow {
    color: var(--gold, #ffd700);
    font-size: 0.72rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
</style>
