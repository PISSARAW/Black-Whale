<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '../../src/lib/components/fighting/FightScene.svelte'
  import FightVictoryOverlay from '../../src/lib/components/fighting/FightVictoryOverlay.svelte'
  import { createHalkenburgFatalityFilm } from './halkenburgFatalityFilm'
  import { selectVictory } from '../../src/lib/fighting/victory/catalogue'
  import { FIGHTING_ROSTER } from '../../src/lib/fighting/roster'
  import { FIGHT_STAGES } from '../../src/lib/fighting/stages'
  const query = new URLSearchParams(location.search)
  const target =
    FIGHTING_ROSTER.find((fighter) => fighter.id === query.get('target'))?.id ?? 'hisoka'
  const stageId =
    FIGHT_STAGES.find((stage) => stage.id === query.get('stage'))?.id ?? 'halkenburg-salon'
  const film = createHalkenburgFatalityFilm({
    target,
    stageId,
    side: query.get('side') === 'opponent' ? 'opponent' : 'player',
  })
  const state = film.state,
    selected = selectVictory(state)!
  let index = 0,
    mounted = false,
    failed = false
  $: frame = { ...selected, elapsed: index / 60, active: true }
  $: phase =
    index < 66
      ? 'Une seule volonté'
      : index < 150
        ? 'Le serment des compagnons'
        : index < 246
          ? 'L’aura converge'
          : index < 300
            ? 'Grimmel the Dissonance'
            : index < 324
              ? 'La flèche est décochée'
              : index < 410
                ? 'Le transfert de conscience'
                : index < 480
                  ? 'Le corps change de maître'
                  : 'Une seule volonté'
  export const ready = () => mounted || failed
  export const count = () => 600
  export const report = () => ({
    ...film.report,
    failed,
    currentAge: index,
    nativeState: JSON.stringify(state),
  })
  export async function seek(age: number) {
    index = Math.max(0, Math.min(599, age))
    await tick()
  }
</script>

<main>
  <FightScene
    {state}
    {stageId}
    victoryFrame={frame}
    hideSecondaryView
    keepCombatantMarkers={false}
    presentationSeconds={index / 60}
    comfort={{
      camera: query.has('reduced') ? 0 : 1,
      shake: 0,
      flashes: !query.has('reduced'),
      highContrast: false,
    }}
    onSceneReady={() => (mounted = true)}
    onSceneFailed={() => (failed = true)}
  />
  <FightVictoryOverlay {state} {frame} language="fr" onSkip={() => {}} />
  <div class="credits">
    <b>BLACK WHALE <span>CLASH</span></b>
    <p>{phase}</p>
    <small>HALKENBURG · GRIMMEL THE DISSONANCE</small>
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #07090e;
    color: #f7eee6;
  }
  :global(*) {
    box-sizing: border-box;
  }
  main {
    width: 100vw;
    height: 100vh;
    position: relative;
    overflow: hidden;
    font-family: Arial, sans-serif;
  }
  .credits {
    position: absolute;
    bottom: 1.2%;
    left: 3%;
    right: 17%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    color: #dfc68c;
    letter-spacing: 0.1em;
    font-size: clamp(8px, 1.1vw, 17px);
    pointer-events: none;
    z-index: 40;
  }
  :global(.skip-victory) {
    display: none;
  }
  .credits b {
    font-size: 0.7em;
  }
  .credits span {
    color: #eee;
    margin-left: 0.5em;
  }
  .credits p {
    font-size: 0.8em;
    text-transform: uppercase;
    margin: 0;
  }
  .credits small {
    font-size: 0.5em;
  }
  @media (max-width: 700px) {
    .credits small {
      display: none;
    }
    .credits {
      right: 28%;
    }
  }
</style>
