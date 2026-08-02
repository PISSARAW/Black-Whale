<script lang="ts">
  import Seo from '$lib/components/Seo.svelte'
  import TourPageHeader from '$lib/components/tour/TourPageHeader.svelte'
  import { link, t } from '$lib/i18n'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import type { Ship } from '$lib/tour/blueprint'
  import { shipLength } from '$lib/tour/pagePresentation'

  interface Props {
    ship: Ship
  }

  let { ship }: Props = $props()
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
