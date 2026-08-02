<script lang="ts">
  let {
    won,
    turn,
    victoryPoints,
    reports,
    onrestart,
  }: {
    won: boolean
    turn: number
    victoryPoints: number
    reports: string[]
    onrestart: () => void
  } = $props()
</script>

<div class="strategy-debrief" role="status">
  <p>Rapport final · tour {turn}</p>
  <h2>{won ? 'Victoire stratégique' : 'Opération compromise'}</h2>
  <strong>{victoryPoints} point{victoryPoints > 1 ? 's' : ''} d’influence</strong>
  <div>
    {#each reports.slice(-4) as report (report)}<span>{report}</span>{/each}
  </div>
  <button type="button" onclick={onrestart}>Rejouer le scénario</button>
</div>
