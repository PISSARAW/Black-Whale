<script lang="ts">
  import type { arenaSectorSituation } from '$lib/arena/sectorTour'

  let {
    situation,
    french,
    href,
  }: {
    situation: ReturnType<typeof arenaSectorSituation> | null
    french: boolean
    href: string
  } = $props()
  const sectorTitle = $derived.by(() => {
    if (!situation) return french ? 'Engager le duel du secteur' : 'Enter the sector duel'
    if (situation.phase === 'lockdown')
      return french ? 'Intervention imminente' : 'Intervention imminent'
    if (situation.phase === 'watched')
      return french ? 'Secteur sous surveillance' : 'Sector under watch'
    if (situation.phase === 'altered')
      return french ? 'Reprendre le duel altéré' : 'Resume the altered duel'
    return french ? 'Engager le duel du secteur' : 'Enter the sector duel'
  })
  const outcomes = {
    controlled: ['LAST OUTCOME · SECTOR CONTROLLED', 'DERNIÈRE ISSUE · SECTEUR CONTRÔLÉ'],
    exposed: ['LAST OUTCOME · COVER BLOWN', 'DERNIÈRE ISSUE · COUVERTURE PERDUE'],
    intercepted: ['LAST OUTCOME · INTERCEPTION', 'DERNIÈRE ISSUE · INTERCEPTION'],
    'rival-held': ['LAST OUTCOME · HISOKA HOLDS', 'DERNIÈRE ISSUE · HISOKA TIENT LE SECTEUR'],
  } as const
  const objective = ['OBJECTIVE · TAKE CONTROL', 'OBJECTIF · PRENDRE LE CONTRÔLE'] as const
  const sectorAftermath = $derived(
    (outcomes[situation?.lastResolution as keyof typeof outcomes] ?? objective)[Number(french)],
  )
</script>

<a class="arena-sector-entry" data-phase={situation?.phase ?? 'quiet'} {href}>
  <small>ARENA × TOUR</small>
  <strong>{sectorTitle}</strong>
  {#if situation}
    <span class="arena-sector-state">
      {french ? 'COMBATS' : 'FIGHTS'}
      {situation.fights} ·
      {french ? 'TÉMOINS' : 'WITNESSES'}
      {situation.witnesses} ·
      {french ? 'ALERTE' : 'ALERT'}
      {situation.securityAlert}/5
    </span>
    <span>
      {situation.changedObjects}
      {french ? 'OBJETS ALTÉRÉS' : 'ALTERED OBJECTS'} ·
      {situation.opponentReads}
      {french ? 'LECTURES ADVERSES' : 'OPPONENT READS'} ·
      {situation.parcelStage.replaceAll('_', ' ')}
    </span>
    <span>{sectorAftermath}</span>
  {:else}
    <span
      >{french
        ? 'Combat 3D · conséquences persistantes'
        : '3D combat · persistent consequences'}</span
    >
  {/if}
</a>

<style>
  .arena-sector-entry {
    position: fixed;
    z-index: 34;
    bottom: calc(7.5rem + env(safe-area-inset-bottom));
    left: 50%;
    display: flex;
    width: min(22rem, calc(100vw - 2rem));
    padding: 0.75rem 0.9rem;
    border: 1px solid rgb(255 215 0 / 42%);
    border-left: 3px solid #ffd700;
    background: rgb(4 9 12 / 90%);
    color: #fffff0;
    flex-direction: column;
    gap: 0.15rem;
    font-family: 'IBM Plex Mono', monospace;
    text-decoration: none;
    transform: translateX(-50%);
    backdrop-filter: blur(10px);
  }

  .arena-sector-entry small,
  .arena-sector-entry span {
    color: #a8b3b7;
    font-size: 0.58rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .arena-sector-entry strong {
    font-size: 0.78rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .arena-sector-entry[data-phase='watched'] {
    border-left-color: #ff9e43;
  }

  .arena-sector-entry[data-phase='lockdown'] {
    border-color: rgb(255 77 94 / 55%);
    border-left-color: #ff4d5e;
  }

  .arena-sector-entry .arena-sector-state {
    color: #fffff0;
  }

  .arena-sector-entry:hover,
  .arena-sector-entry:focus-visible {
    border-color: #ffd700;
    background: rgb(10 18 22 / 96%);
    outline: none;
  }

  @media (max-width: 760px) {
    .arena-sector-entry {
      bottom: calc(5.8rem + env(safe-area-inset-bottom));
    }
  }
</style>
