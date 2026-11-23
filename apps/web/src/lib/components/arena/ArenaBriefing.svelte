<script lang="ts">
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
          {sector.parcelStage.replaceAll('_', ' ')}
        </small>
      </div>
    {/if}
    <ol class="briefing-steps">
      <li>
        <kbd>{$t.arena.ui.moveKeys}</kbd>
        <span><strong>{$t.arena.ui.approach}</strong>{$t.arena.ui.approachSuffix}</span>
      </li>
      <li>
        <kbd>CLIC · J</kbd>
        <span><strong>{$t.arena.ui.strike}</strong>{$t.arena.ui.strikeSuffix}</span>
      </li>
      <li>
        <kbd>ESPACE</kbd>
        <span><strong>{$t.arena.ui.block}</strong>{$t.arena.ui.blockSuffix}</span>
      </li>
    </ol>
    <button class="briefing-start" onclick={onStart}>{startLabel}</button>
  </div>
</div>
