<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import { defaultFightComfort, type FightComfort } from '$lib/fighting/fightComfort'
  import { pursuitReview } from './scenarios'

  const hanzo = new URLSearchParams(location.search).has('hanzo')
  const kurapika = new URLSearchParams(location.search).has('kurapika')
  const identifiers = hanzo
    ? (['hanzo'] as const)
    : kurapika
      ? (['kurapika'] as const)
      : (['centre', 'coin'] as const)
  const tracks = identifiers.map((id) => ({ id, ...pursuitReview(id) }))
  const labels = {
    centre: 'Centre',
    coin: 'Coin droit',
    hanzo: 'Hanzo · Double astral',
    kurapika: 'Kurapika · Fouet',
  }
  const comfort: FightComfort = { ...defaultFightComfort(), graphics: 'performance', shake: 0 }
  let elapsed = -12
  let ready = 0
  let frozen = false
  let failed = false

  const paint = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  async function frame(value: number, pause = false) {
    elapsed = value
    frozen = pause
    await tick()
    await paint()
    await paint()
  }

  Object.assign(window, {
    pursuitReview: {
      frame,
      ready: () => ready === tracks.length,
      failed: () => failed,
      summary: tracks.map(({ id, command, launch, opening, contact, winner, states }) => ({
        id,
        command,
        launch,
        opening,
        contact,
        winner,
        length: states.length,
        sleepingBody: states[contact].player.hanzoProjection?.bodyX ?? null,
        finisher: states[contact].player.attack?.moveId ?? null,
        hits: states[contact].impact?.comboHits,
      })),
    },
  })

  function frameAt(length: number, command: number, value: number) {
    return Math.max(0, Math.min(length - 1, command + value))
  }
</script>

<main class:single={tracks.length === 1}>
  <header>
    <p>BLACK WHALE · CLASH</p>
    <h1>{hanzo ? 'Le double au coin' : kurapika ? 'Du sol au fouet' : 'Qui reprend la main ?'}</h1>
    <p>
      {hanzo
        ? 'Le corps reste exposé'
        : kurapika
          ? 'Appui avant · Rotation du buste'
          : 'Hisoka – Kurapika · Même commande, même délai'}
    </p>
  </header>
  {#each tracks as track (track.id)}
    {@const index = frameAt(track.states.length, track.command, elapsed)}
    <section aria-label={labels[track.id]}>
      <div class="shot">
        <FightScene
          state={track.states[index]}
          {comfort}
          active={false}
          showRecovery
          stageId="whale-hold"
          presentationSeconds={index / 60}
          hideSecondaryView
          keepCombatantMarkers={false}
          onSceneReady={() => ready++}
          onSceneFailed={() => (failed = true)}
        />
      </div>
      <div class="panel">
        <strong>{labels[track.id]}</strong>
        {#if index === track.command}<span>↑ + J</span>{/if}
      </div>
    </section>
  {/each}
  <footer>
    {#if elapsed >= tracks[0].launch - tracks[0].command}
      <strong>F{String(elapsed - tracks[0].launch + tracks[0].command).padStart(2, '0')}</strong>
      <span>{frozen ? 'Arrêt sur image' : 'Depuis le contact de la relance'}</span>
    {:else}
      <strong>↑ + J</strong><span>Lancement du combo aérien</span>
    {/if}
  </footer>
</main>

<style>
  :global(body) {
    background: #0b1017;
    color: #f3f6fa;
    font-family: system-ui, sans-serif;
  }
  main {
    height: 100dvh;
    display: grid;
    grid-template-rows: auto 1fr 1fr auto;
    overflow: hidden;
  }
  main.single {
    grid-template-rows: auto 1fr auto;
  }
  header,
  footer {
    padding: 12px 20px;
    background: #101924;
  }
  h1 {
    font-size: 1.8rem;
    line-height: 1.04;
    margin: 4px 0;
  }
  p {
    margin: 0;
    color: #bdc9d6;
    font-size: 0.85rem;
  }
  header p:first-child {
    color: #7ceada;
    font-weight: 700;
    font-size: 0.68rem;
    letter-spacing: 0.15em;
  }
  section {
    position: relative;
    min-height: 0;
    border-bottom: 2px solid #2b3c4e;
  }
  .shot {
    position: absolute;
    inset: 0;
  }
  .panel {
    position: absolute;
    inset: 12px 16px auto;
    display: flex;
    justify-content: space-between;
    pointer-events: none;
  }
  .panel strong,
  .panel span {
    background: #101924ee;
    padding: 0.3rem 0.55rem;
    border: 1px solid #566b82;
    border-radius: 0.25rem;
  }
  footer {
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }
  footer strong {
    font: 700 1.05rem monospace;
    color: #7ceada;
  }
  footer span {
    color: #bdc9d6;
    font-size: 0.8rem;
  }
</style>
