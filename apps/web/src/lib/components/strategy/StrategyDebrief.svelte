<script lang="ts">
  let {
    won,
    turn,
    victoryPoints,
    reports,
    onrestart,
    oncontinue,
  }: {
    won: boolean
    turn: number
    victoryPoints: number
    reports: string[]
    onrestart: () => void
    oncontinue?: () => void
  } = $props()
</script>

<div class="strategy-debrief" role="status">
  <p>Final Report · turn {turn}</p>
  <h2>{won ? 'Strategic Victory' : 'Operation Compromised'}</h2>
  <strong>{victoryPoints} influence point{victoryPoints > 1 ? 's' : ''}</strong>
  <div>
    {#each reports.slice(-4) as report (report)}<span>{report}</span>{/each}
  </div>
  <button type="button" onclick={onrestart}>Replay Scenario</button>
  {#if oncontinue}<button type="button" onclick={oncontinue}>Continue Campaign</button>{/if}
</div>
