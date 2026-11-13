<script lang="ts">
  import BodyConsciousnessMarker from '$lib/components/perspective/BodyConsciousnessMarker.svelte'
  import type { MarkerIdentityState } from '$lib/components/perspective/types'
  import { mapState } from '$lib/state/mapState.svelte'
  import { t } from '$lib/i18n'

  let {
    character,
    future = false,
    futureMode = false,
  }: {
    character: MarkerIdentityState
    future?: boolean
    futureMode?: boolean
  } = $props()

  function explainMarker(marker: MarkerIdentityState) {
    mapState.openExplainPanel({
      kind: 'character',
      subject: marker.perceivedIdentity,
      location: marker.locationLabel || $t.perspectiveUi.unspecifiedLocation,
      tier: marker.tierLabel || $t.perspectiveUi.outsideTier,
      certainty: marker.certainty || 'UNKNOWN',
      temporalLabel: marker.temporalLabel || $t.perspectiveUi.unknownStatus,
      source: marker.temporalLabel || marker.sourceLabel || $t.mapUi.directObservation,
      observedAt: marker.temporalDetail || marker.sinceLabel || 'unspecified event',
      knowledgeState: marker.knowledgeState,
      profileSlug: marker.profileSlug,
    })
  }
</script>

<BodyConsciousnessMarker
  marker={character}
  compact={mapState.currentZoomLevel === 'OVERVIEW'}
  onExplain={explainMarker}
  {future}
  {futureMode}
/>
