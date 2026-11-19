<script lang="ts">
  import { link, t } from '$lib/i18n'
</script>

<nav aria-label="Breadcrumb" class="fight-breadcrumb" data-fight-scroll>
  <a href={$link('/tour')}>{$t.nav.backToTour}</a>
  <span aria-hidden="true">/</span>
  <a href={$link('/tour/modes')}>{$t.nav.tourModes}</a>
  <span aria-hidden="true">/</span><span aria-current="page">Clash</span>
</nav>
