<script lang="ts">
  import KnowledgeStatus from './KnowledgeStatus.svelte';
  import type { KnowledgeVisualState } from './types';

  let {
    state,
    source
  }: {
    state: KnowledgeVisualState;
    source: string;
  } = $props();
</script>

<KnowledgeStatus state={state} label="Source de connaissance" details={source} />
