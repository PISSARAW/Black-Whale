<script lang="ts">
  import KnowledgeStatus from './KnowledgeStatus.svelte'
  import type { KnowledgeVisualState } from './types'

  let {
    state,
    source,
  }: {
    state: KnowledgeVisualState
    source: string
  } = $props()
</script>

<KnowledgeStatus {state} label="Knowledge source" details={source} />
