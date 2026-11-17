<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '../../src/lib/components/fighting/FightScene.svelte'
  import FightHud from '../../src/lib/components/fighting/FightHud.svelte'
  import { createKurapikaVictoryFilm } from './kurapikaVictoryFilm'
  import { captureKurapikaVictory } from './kurapikaVictoryScene'
  import { renderShowcaseAudio } from './audio'
  const film = createKurapikaVictoryFilm()
  let index = 0
  let state = film.states[0]
  const capture = captureKurapikaVictory(() => ({
    state,
    age: index - film.start,
    camera: film.camera.frames[film.sources[index]],
  }))
  export const ready = () => capture.ready()
  export const count = () => film.states.length
  export const report = () => ({ ...film.report, presentation: capture.audit() })
  export const audio = () => renderShowcaseAudio(film.states)
  export async function seek(frame: number) {
    index = Math.min(film.states.length - 1, frame)
    state = film.states[index]
    await tick()
  }
  $: age = index - film.start
</script>

<main>
  <header>
    <b>BLACK WHALE <span>CLASH</span></b>
    <p>KURAPIKA <i>×</i> CHROLLO</p>
    <small>TOUR CÉLESTE</small>
  </header>
  <section class:cinema={age >= 0}>
    <FightScene
      {state}
      stageId="heavens-arena"
      keepCombatantMarkers={false}
      hideSecondaryView={true}
      presentationSeconds={index / 60}
      comfort={{ camera: 0, shake: 0, flashes: true, highContrast: false }}
    />
    {#if age < 0}<FightHud {state} language="fr" />{/if}
    <div class="shade"></div>
    {#if age >= 180 && age < 184}<div
        class="strike-flash"
        style={`opacity:${0.24 * (1 - (age - 180) / 4)}`}
      ></div>{/if}
    {#if age >= 480}<div class="victory">
        <small>VICTOIRE</small><strong>KURAPIKA</strong><span>LE JUGEMENT ÉCARLATE</span>
      </div>{/if}
  </section>
  <footer>
    <div>
      <small>{age >= 0 ? 'CINÉMATIQUE DE VICTOIRE' : 'COMBAT CONTINU'}</small>
      <h1>{age >= 0 ? 'Le jugement écarlate.' : 'La chaîne trouve sa cible.'}</h1>
    </div>
    <p>
      {age >= 0 ? 'CHAIN JAIL · EMPEROR TIME' : 'KURAPIKA × CHROLLO'}<span>BLACK WHALE · CLASH</span
      >
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
  .strike-flash {
    position: absolute;
    inset: 0;
    background: #e5eef5;
    pointer-events: none;
    z-index: 4;
  }
  .victory {
    position: absolute;
    z-index: 3;
    left: 115px;
    top: 310px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    text-shadow: 0 3px 20px #000;
  }
  .victory small {
    color: #edb5a6;
    letter-spacing: 12px;
    font-size: 20px;
  }
  .victory strong {
    font-size: 61px;
    letter-spacing: 7px;
    font-weight: 500;
  }
  .victory span {
    font-size: 12px;
    letter-spacing: 7px;
    color: #bdb1c1;
  }
</style>
