<script lang="ts">
  import { onMount } from 'svelte'
  import { t } from '$lib/i18n'
  import type { ArenaSectorSituation } from '$lib/arena/sectorTour'

  let {
    onStart,
    goal,
    sector = null,
    french = false,
  }: {
    onStart: () => void
    goal: string
    sector?: ArenaSectorSituation | null
    french?: boolean
  } = $props()

  let ready = $state(false)
  onMount(() => {
    ready = true
  })

  const phaseLabel = $derived.by(() => {
    if (!sector) return null
    if (sector.phase === 'lockdown')
      return french ? 'Intervention imminente' : 'Intervention imminent'
    if (sector.phase === 'watched') return french ? 'Secteur surveillé' : 'Sector under watch'
    if (sector.phase === 'altered')
      return french ? 'Terrain déjà altéré' : 'Terrain already altered'
    return french ? 'Secteur calme' : 'Quiet sector'
  })

  const startLabel = $derived.by(() => {
    if (!sector || sector.phase === 'quiet') return $t.arena.ui.enterArena
    if (sector.phase === 'lockdown')
      return french ? "Entrer avant l'intervention" : 'Enter before intervention'
    if (sector.phase === 'watched') return french ? 'Entrer sous surveillance' : 'Enter under watch'
    return french ? 'Reprendre le duel' : 'Resume the duel'
  })

  const objectiveLabel = $derived.by(() => {
    if (!sector) return null
    if (sector.objective === 'beat-intervention')
      return french ? "Vaincre avant l'arrivée de la sécurité" : 'Win before security intervenes'
    if (sector.objective === 'stay-unseen')
      return french ? "Gagner sans augmenter l'alerte" : 'Win without raising the alert'
    if (sector.objective === 'break-adaptation')
      return french ? "Briser l'adaptation de Hisoka" : "Break Hisoka's adaptation"
    return french ? 'Prendre le contrôle du secteur' : 'Take control of the sector'
  })
</script>

<div
  class="combat-briefing"
  role="dialog"
  aria-modal="true"
  aria-labelledby="combat-briefing-title"
>
  <div class="briefing-card">
    <p class="briefing-kicker">{$t.arena.ui.beforeFight}</p>
    <h2 id="combat-briefing-title">{$t.arena.ui.briefingTitle}</h2>
    <p class="briefing-goal">{goal}</p>
    {#if sector}
      <div class="briefing-sector" data-phase={sector.phase}>
        <strong>{phaseLabel}</strong>
        <em>{objectiveLabel}</em>
        <span>
          {french ? 'Combats' : 'Fights'}
          {sector.fights} ·
          {french ? 'Témoins' : 'Witnesses'}
          {sector.witnesses} ·
          {french ? 'Alerte' : 'Alert'}
          {sector.securityAlert}/5
        </span>
        <small>
          {sector.changedObjects}
          {french ? 'objets altérés' : 'altered objects'} ·
          {sector.opponentReads}
          {french ? 'lectures adverses' : 'opponent reads'} ·
          {sector.parcelStage.replaceAll('_', ' ')}
        </small>
      </div>
    {/if}
    <ol class="briefing-steps">
      <li>
        <kbd>{$t.arena.ui.moveKeys} · F</kbd>
        <span>
          <strong>{french ? 'Approche' : 'Close the gap'}</strong>
          {french
            ? ' Déplace-toi autour de l’adversaire ou utilise Ruée pour l’engager.'
            : ' Circle your opponent or use Rush to engage.'}
        </span>
      </li>
      <li>
        <kbd>{french ? 'CLIC · J' : 'CLICK · J'}</kbd>
        <span>
          <strong>{french ? 'Enchaîne' : 'Keep attacking'}</strong>
          {french
            ? ' Presse J pendant la ruée pour attaquer dès que l’adversaire est à portée.'
            : ' Press J during a rush to attack as soon as your opponent is in range.'}
        </span>
      </li>
      <li>
        <kbd>{french ? 'ESPACE · R' : 'SPACE · R'}</kbd>
        <span>
          <strong>{french ? 'Défends-toi' : 'Defend'}</strong>
          {french
            ? ' Maintiens la garde ou esquive latéralement avec R et une direction.'
            : ' Hold guard or press R with a direction to dodge.'}
        </span>
      </li>
    </ol>
    <button class="briefing-start" disabled={!ready} onclick={onStart}>{startLabel}</button>
  </div>
</div>
