<script lang="ts">
  import Seo from '$lib/components/Seo.svelte'
  import TourPageHeader from '$lib/components/tour/TourPageHeader.svelte'
  import { link, locale, t } from '$lib/i18n'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import type { Ship } from '$lib/tour/blueprint'
  import { shipLength } from '$lib/tour/pagePresentation'

  interface Props {
    ship: Ship
    routeHref: string
    diningHref: string
  }

  let { ship, routeHref, diningHref }: Props = $props()
</script>

<Seo
  title={$t.tour.seoTitle}
  description={$t.tour.seoDescription}
  jsonLd={breadcrumbSchema([
    { name: $t.common.home, path: $link('/') },
    { name: $t.nav.virtualTour, path: $link('/tour') },
  ])}
/>

<TourPageHeader
  title={$t.tour.title}
  intro={$t.tour.intro}
  counts={$t.tour.counts(
    ship.blueprint.spaces.length,
    ship.decks.length,
    ship.tiers.length - ship.decks.length,
  )}
  scale={$t.tour.scale(shipLength(ship))}
  morenaTitle={$t.tour.morena.title}
  morenaHref={$link('/tour/morena')}
  modesTitle={$t.nav.tourModes}
  modesHref={$link('/tour/modes')}
/>

<div class="route-start">
  <a href={diningHref}>
    <strong>{$locale === 'fr' ? 'Du pont 4 au réfectoire' : 'From deck 4 to the refectory'}</strong>
    <small>
      {$locale === 'fr'
        ? 'Vie libre · env. 10 min · suivez les panneaux et observez les routines reconstituées'
        : 'Free life · about 10 min · follow the signs and watch the reconstructed routines'}
    </small>
  </a>
  <a href={routeHref}>
    {$locale === 'fr'
      ? 'Refaire le parcours de Tserriednich (chap. 419–420)'
      : 'Replay Tserriednich’s route (ch. 419–420)'}
  </a>
</div>

<style>
  .route-start {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    align-items: stretch;
    gap: 0.5rem;
    margin: -0.5rem 1rem 1.25rem;
  }
  .route-start a {
    padding: 0.55rem 0.8rem;
    border: 1px solid rgb(255 215 0 / 0.35);
    border-radius: 2px;
    color: var(--gold, #ffd700);
    font-size: 0.76rem;
    letter-spacing: 0.04em;
    text-decoration: none;
  }
  .route-start small {
    display: block;
    margin-top: 0.2rem;
    color: rgb(255 255 240 / 0.76);
    font-size: 0.72rem;
    letter-spacing: normal;
  }
  .route-start a:hover,
  .route-start a:focus-visible {
    border-color: rgb(255 215 0 / 0.75);
    background: rgb(255 215 0 / 0.06);
  }
</style>
