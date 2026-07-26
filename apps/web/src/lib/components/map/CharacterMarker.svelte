<script lang="ts">
  import BodyConsciousnessMarker from '$lib/components/perspective/BodyConsciousnessMarker.svelte';
  import type { MarkerIdentityState } from '$lib/components/perspective/types';
  import { mapState } from '$lib/state/mapState.svelte';

  let { character }: {
    character: MarkerIdentityState;
  } = $props();

  function explainMarker(marker: MarkerIdentityState) {
    mapState.openExplainPanel({
      subject: marker.perceivedIdentity,
      value: marker.body,
      source: marker.temporalLabel || marker.sourceLabel || 'Direct observation',
      observedAt: marker.temporalDetail || marker.sinceLabel || 'unspecified event',
      freshness: marker.knowledgeState === 'outdated' ? 'not recently confirmed' : 'recent information',
      knowledgeState: marker.knowledgeState,
      canonicalValue: `${marker.body} / ${marker.consciousness}`
    });
  }
</script>

<BodyConsciousnessMarker marker={character} compact={mapState.currentZoomLevel === 'OVERVIEW'} onExplain={explainMarker} />
