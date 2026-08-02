<script lang="ts">
  import InvestigationCaseView from '$lib/components/investigation/InvestigationCaseView.svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
</script>

<InvestigationCaseView caseId={data.caseId} />
