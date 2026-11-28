<script lang="ts">
  import { tick } from 'svelte'
  import FightPhinksVerdict from '../../src/lib/components/fighting/FightPhinksVerdict.svelte'
  import FightScene from '../../src/lib/components/fighting/FightScene.svelte'
  import { selectVictory } from '../../src/lib/fighting/victory/catalogue'
  import { PHINKS_VICTORY_FRAMES } from '../../src/lib/fighting/victory/phinksTiming'
  import { createPhinksFatalityFilm } from './phinksFatalityFilm'

  const film = createPhinksFatalityFilm()
  const state = film.state
  const selection = selectVictory(state)!
  let age = 0
  let mounted = false
  let failed = false
  $: victoryFrame = { ...selection, elapsed: age / 60, active: true }

  export const ready = () => mounted || failed
  export const count = () => PHINKS_VICTORY_FRAMES
  export const report = () => ({ ...film.report, failed })
  export async function seek(frame: number) {
    age = Math.max(0, Math.min(PHINKS_VICTORY_FRAMES - 1, frame))
    await tick()
  }
</script>

<main>
  <header>
    <b>BLACK WHALE <span>CLASH</span></b>
    <p>PHINKS <i>×</i> KURAPIKA</p>
    <small>TOUR CÉLESTE</small>
  </header>
  <section class="cinema">
    <FightScene
      {state}
      stageId="heavens-arena"
      keepCombatantMarkers={false}
      hideSecondaryView={true}
      {victoryFrame}
      presentationSeconds={age / 60}
      comfort={{ camera: 1, shake: 0.5, flashes: true, highContrast: false }}
      onSceneReady={() => (mounted = true)}
      onSceneFailed={() => (failed = true)}
    />

    <div class="shade"></div>
    <FightPhinksVerdict elapsed={age / 60} language="fr" />
  </section>
  <footer>
    <div>
      <small>PHINKS</small>
      <h1>Le dernier tour</h1>
    </div>
    <p>
      RIPPER CYCLOTRON<span>BLACK WHALE · CLASH</span>
    </p>
  </footer>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #07090e;
    overflow: hidden;
    color: #f7eee6;
  }
  :global(*) {
    box-sizing: border-box;
  }
  main {
    width: 1920px;
    height: 1080px;
    font-family: Arial, sans-serif;
    --hud-scale: 1.08;
    --hud-font: 14px;
  }
  header {
    height: 76px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 56px;
    background: #090d14;
    border-bottom: 1px solid #65516c;
    letter-spacing: 5px;
  }
  header b {
    font-size: 21px;
  }
  header b span {
    color: #d95359;
    font-size: 13px;
    margin-left: 12px;
  }
  header p {
    font-size: 17px;
  }
  header i {
    font-style: normal;
    color: #d690ba;
    margin: 0 16px;
  }
  header small {
    font-size: 11px;
    color: #b8a6b8;
  }
  section {
    height: 864px;
    position: relative;
    overflow: hidden;
  }
  .shade {
    position: absolute;
    inset: 0;
    pointer-events: none;
    box-shadow: inset 0 -50px 90px #08070d90;
  }
  section.cinema:before,
  section.cinema:after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 48px;
    background: #08090c;
    z-index: 2;
    pointer-events: none;
  }
  section.cinema:before {
    top: 0;
  }
  section.cinema:after {
    bottom: 0;
  }
  footer {
    height: 140px;
    padding: 25px 56px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #5e4058;
    background: linear-gradient(110deg, #1a1020, #090d13);
  }
  footer small {
    font-size: 10px;
    letter-spacing: 4px;
    color: #d49a91;
  }
  h1 {
    font-size: 29px;
    font-weight: 500;
    margin: 12px 0 0;
    letter-spacing: 1px;
  }
  footer p {
    font-size: 14px;
    letter-spacing: 4px;
    color: #e4c7d7;
    text-align: right;
  }
  footer p span {
    display: block;
    font-size: 9px;
    color: #8d8190;
    letter-spacing: 3px;
    margin-top: 13px;
  }
</style>
