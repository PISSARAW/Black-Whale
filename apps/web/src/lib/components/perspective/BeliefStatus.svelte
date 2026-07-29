<script lang="ts">
  import KnowledgeStatus from './KnowledgeStatus.svelte'
  import type { KnowledgeVisualState } from './types'
  import { t } from '$lib/i18n'

  let {
    state,
    source,
  }: {
    state: KnowledgeVisualState
    source: string
  } = $props()
</script>

<KnowledgeStatus {state} label={$t.perspectiveUi.knowledgeSource} details={source} />
