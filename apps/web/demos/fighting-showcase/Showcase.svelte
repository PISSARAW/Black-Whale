<script lang="ts">
  import { createCatsSpectacle } from './catsSpectacle'
  import CatsSpectacleOverlay from './CatsSpectacleOverlay.svelte'
  import { createSolarVision } from './solarVision'
  import SolarPrediction from './SolarPrediction.svelte'
  import { selectShowcase } from './showcaseSelection'
  import CatsStatus from './CatsStatus.svelte'
  import JudgmentStatus from './JudgmentStatus.svelte'
  import { tick } from 'svelte'
  import FightScene from '../../src/lib/components/fighting/FightScene.svelte'
  import FightHud from '../../src/lib/components/fighting/FightHud.svelte'
  import { nenStatus } from '../../src/lib/fighting/nen'
  import SolarStatus from './SolarStatus.svelte'
  import { showcaseStageName } from './showcaseLabels'
  import { renderShowcaseAudio } from './audio'
  import { captureShowcaseScene } from './showcaseSceneCapture'
  import CloseupOverlay from './CloseupOverlay.svelte'
  import { fighterDefinition } from '../../src/lib/fighting/roster'

  const {
    film,
    continuous,
    cinematic,
    solar,
    ballroom,
    judgment,
    cats,
    rangedDuel,
    closeupTrack,
    cameraTrack,
  } = selectShowcase(window.location.search)
  const solarVision = solar ? createSolarVision(film.states, cameraTrack?.frames) : null
  const spectacle = new URLSearchParams(window.location.search).has('spectacle')
    ? createCatsSpectacle(film)
    : null
  const playback = spectacle?.frames ?? film.frames
  let prediction = false
  const playerName = fighterDefinition(film.state.player.id).name.toUpperCase()
  const opponentName = fighterDefinition(film.state.opponent.id).name.toUpperCase()
  const stageId = film.state.environment.stageId
  const stageName = showcaseStageName(stageId, ballroom)
  let index = 0
  let view = playback[0]
  const capture = captureShowcaseScene({
    ranged: rangedDuel,
    camera: () =>
      spectacle?.shots[index]?.camera ??
      (prediction ? solarVision?.camera.frames[index] : cameraTrack?.frames[index]),
    detail: () => closeupTrack?.frames[index],
    spectacle: () => spectacle?.shots[index],
  })

  export function report() {
    return {
      ...film.report(),
      camera: cameraTrack?.report,
      closeups: closeupTrack?.report,
      solarVision: solarVision?.report,
      spectacle: spectacle?.report,
      catPresentation: capture.diagnostics(),
    }
  }
  export function ready() {
    return capture.ready()
  }
  export function count() {
    return playback.length
  }
  export async function seek(frame: number, perceived = false) {
    prediction = perceived
    index = Math.max(0, Math.min(playback.length - 1, frame))
    view =
      prediction && solarVision
        ? { ...playback[index], state: solarVision.states[index] }
        : playback[index]
    await tick()
  }
  export async function audio() {
    return renderShowcaseAudio(film.states)
  }
  $: progress = index / (playback.length - 1)
  $: impact = view.state.impact
  $: impactFresh =
    impact && (impact.attacker === 'player' ? view.state.opponent : view.state.player).hitStun > 0
  $: combo = Math.max(view.state.player.comboHits, view.state.opponent.comboHits)
</script>

<main class:continuous class:cinematic>
  <header>
    <b>BLACK WHALE<span>CLASH</span></b>
    <div>{playerName} <i>×</i> {opponentName}</div>
    <p>{stageName} <span>MODE FIGHTING</span></p>
  </header>
  <section class="arena">
    <FightScene
      state={view.state}
      {stageId}
      keepCombatantMarkers={!spectacle && !rangedDuel}
      presentationSeconds={spectacle ? index / 60 : undefined}
      comfort={{ camera: 0, shake: 1, flashes: true, highContrast: false }}
    />
    <div class="vignette"></div>
    {#if closeupTrack?.frames[index]}<CloseupOverlay frame={closeupTrack.frames[index]!} />{/if}
    <FightHud state={view.state} language="fr" />
    {#if solar && !prediction}<SolarStatus state={view.state} />{/if}
    {#if judgment}<JudgmentStatus state={view.state} />{/if}
    {#if cats && !spectacle}<CatsStatus state={view.state} />{/if}
    {#if spectacle}<CatsSpectacleOverlay shot={spectacle.shots[index]} />{/if}
    {#if prediction && solarVision}<SolarPrediction
        health={view.state.opponent.health}
        damage={solarVision.damageAt(index)}
      />{/if}
    {#if continuous && view.state.phase === 'finished'}<div class="verdict">
        {ballroom || cats ? 'VICTOIRE' : 'K.-O.'}<span
          >{view.state.winner === 'player' ? playerName : opponentName}</span
        >
      </div>{/if}
    <div class="chapter">
      {#if continuous}<span>COMBAT CONTINU</span> UN SEUL DUEL
      {:else}<span>{String(Math.min(8, view.chapter - 1)).padStart(2, '0')} / 08</span> DÉMONSTRATION
        DU JEU{/if}
    </div>
    {#if impactFresh && impact && !impact.avoided && !view.state.catsName}
      <aside
        style={rangedDuel ? 'left: 56px; right: auto; top: 200px' : ''}
        class:magenta={impact.attacker === 'player'}
        class="impact"
      >
        <strong
          >{impact.blocked
            ? 'GARDE'
            : impact.critical
              ? 'KO · CRITIQUE'
              : combo > 1
                ? `${combo} HITS`
                : impact.counterHit
                  ? 'CONTRE'
                  : 'IMPACT'}</strong
        >
        <small>{impact.blocked ? 'ATTAQUE BLOQUÉE' : `${Math.round(impact.damage)} DÉGÂTS`}</small>
      </aside>
    {/if}
    <div class="live-nen">
      <span>{playerName} <b>{nenStatus(view.state.player).join(' · ').toUpperCase()}</b></span><span
        >{opponentName} <b>{nenStatus(view.state.opponent).join(' · ').toUpperCase()}</b></span
      >
    </div>
    {#if ballroom && view.state.player.kurapika?.emperorTime}<div class="emperor-label">
        EMPEROR TIME
      </div>{/if}
    {#if view.card}
      <div class="title-card" class:outro={view.card === 'outro'}>
        <div class="line"></div>
        <p>{view.card === 'intro' ? 'BLACK WHALE · CLASH' : 'LA STRATÉGIE PREND CORPS'}</p>
        <h1>{view.title}</h1>
        <h2>{view.subtitle}</h2>
        <div class="title-tags">
          {view.card === 'intro'
            ? 'TOUR CÉLESTE / DÉMONSTRATION DU JEU'
            : 'TEN · REN · ZETSU · GYO · IN · EN · SHU · KEN · RYU · KO · HATSU'}
        </div>
      </div>
    {/if}
  </section>
  <footer>
    <div class="caption">
      <div class="tags">
        {#each view.tags as tag (tag)}<span>{tag}</span>{/each}
      </div>
      <h2>{view.title}</h2>
      <p>{view.subtitle}</p>
    </div>
    <div class="mark">COMBAT<br /><b>× NEN</b><small>DÉMO CHORÉGRAPHIÉE</small></div>
  </footer>
  <div class="progress"><span style={`width:${progress * 100}%`}></span></div>
</main>

<style>
  :global(body) {
    margin: 0;
    overflow: hidden;
    background: #07090e;
    color: #f3f2ec;
  }
  :global(*) {
    box-sizing: border-box;
  }
  main {
    width: 1920px;
    height: 1080px;
    --hud-scale: 1.38;
    --hud-font: 16px;
    font-family: Arial, sans-serif;
    background: #090d12;
  }
  header {
    height: 86px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 56px;
    border-bottom: 1px solid #78633c;
    background: #0a0e14;
    position: relative;
    z-index: 30;
  }
  header > b {
    font-size: 24px;
    letter-spacing: 4px;
  }
  header > b span {
    display: block;
    font-size: 10px;
    color: #d3b981;
    letter-spacing: 10px;
    margin-top: 6px;
  }
  header > div {
    font-size: 18px;
    letter-spacing: 7px;
  }
  header i {
    color: #d6b87a;
    font-style: normal;
    margin: 0 15px;
  }
  header p {
    font-size: 14px;
    letter-spacing: 3px;
    text-align: right;
    color: #d6b87a;
  }
  header p span {
    display: block;
    color: #91a0ad;
    font-size: 10px;
    letter-spacing: 4px;
    margin-top: 6px;
  }
  .arena {
    position: relative;
    height: 768px;
    overflow: hidden;
  }
  .vignette {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    box-shadow: inset 0 -45px 65px #070b12b0;
  }
  .chapter {
    position: absolute;
    left: 56px;
    top: 159px;
    z-index: 20;
    color: #b6c2cb;
    font-size: 11px;
    letter-spacing: 3px;
  }
  .chapter span {
    color: #e4c887;
    margin-right: 16px;
  }
  .live-nen {
    position: absolute;
    bottom: 24px;
    left: 56px;
    right: 56px;
    z-index: 20;
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    letter-spacing: 2px;
    color: #aeb7c1;
  }
  .live-nen b {
    color: #c8d6e0;
    border-left: 1px solid #74828a;
    padding-left: 16px;
    margin-left: 16px;
  }
  .live-nen > span:first-child b {
    color: #ff9cd4;
  }
  .live-nen > span:last-child b {
    color: #9bd6ec;
  }
  .impact {
    position: absolute;
    z-index: 20;
    right: 16%;
    top: 43%;
    text-align: center;
    text-shadow: 0 3px 8px #000;
    color: #9fe2f5;
  }
  .impact.magenta {
    left: 16%;
    right: auto;
    color: #ff9ed6;
  }
  .impact strong {
    display: block;
    font-size: 41px;
    letter-spacing: 4px;
  }
  .impact small {
    display: block;
    font-size: 11px;
    letter-spacing: 4px;
    margin-top: 8px;
  }
  footer {
    height: 220px;
    border-top: 1px solid #51452e;
    padding: 27px 56px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(110deg, #111923, #090d13 78%);
  }
  .tags {
    display: flex;
    gap: 10px;
  }
  .tags span {
    color: #e2c78c;
    font-size: 11px;
    font-weight: bold;
    letter-spacing: 2px;
    padding: 6px 11px;
    border: 1px solid #76613e;
  }
  .caption h2 {
    font-size: 32px;
    font-weight: 500;
    letter-spacing: 0.3px;
    margin: 14px 0 9px;
  }
  .caption p {
    margin: 0;
    font-size: 18px;
    color: #afbecb;
  }
  .mark {
    border-left: 1px solid #52616d;
    padding-left: 30px;
    font-size: 20px;
    letter-spacing: 6px;
    color: #c5cdd3;
    line-height: 1.35;
  }
  .mark b {
    color: #ddc184;
  }
  .mark small {
    display: block;
    font-size: 8px;
    letter-spacing: 2px;
    color: #7d8b98;
    margin-top: 15px;
  }
  .progress {
    height: 6px;
    background: #202a33;
  }
  .progress span {
    display: block;
    height: 100%;
    background: #d8b76f;
  }
  .title-card {
    position: absolute;
    z-index: 25;
    inset: 0;
    background: linear-gradient(90deg, #070b12e8, #070b12ab, #070b12d9);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }
  .line {
    width: 60px;
    height: 2px;
    background: #d5b77c;
    margin-bottom: 30px;
  }
  .title-card p {
    font-size: 14px;
    letter-spacing: 9px;
    color: #ddc38a;
  }
  h1 {
    font-size: 90px;
    letter-spacing: 9px;
    font-weight: 500;
    margin: 20px 0 22px;
  }
  .title-card h2 {
    font-size: 25px;
    font-weight: 400;
    color: #bdcbd7;
    letter-spacing: 2px;
  }
  .title-tags {
    margin-top: 47px;
    color: #8e9daa;
    font-size: 12px;
    letter-spacing: 5px;
  }
  .outro h1 {
    font-size: 100px;
    letter-spacing: 16px;
  }
  .continuous header {
    height: 76px;
  }
  .verdict {
    position: absolute;
    z-index: 24;
    left: 50%;
    top: 29%;
    transform: translateX(-50%);
    color: #e8c582;
    font:
      800 100px/1 Arial,
      sans-serif;
    letter-spacing: 15px;
    text-shadow: 0 4px 24px #000;
    text-align: center;
  }
  .verdict span {
    display: block;
    color: #f1e9df;
    font-size: 22px;
    letter-spacing: 10px;
    margin-top: 18px;
  }
  .continuous .arena {
    height: 858px;
  }
  .continuous footer {
    height: 140px;
    padding: 16px 56px;
  }
  .continuous .caption {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    column-gap: 24px;
  }
  .continuous .caption h2 {
    margin: 0;
    font:
      600 26px/1.2 Arial,
      sans-serif;
    grid-column: 1;
    grid-row: 1;
  }
  .continuous .tags {
    grid-column: 2;
    grid-row: 1;
  }
  .continuous .caption p {
    grid-column: 1 / -1;
    margin-top: 12px;
    font-size: 17px;
  }
  .continuous .mark {
    font-size: 15px;
  }
  .continuous .mark small {
    margin-top: 8px;
  }
  .continuous .arena :global(.fight-scene) {
    transform: scale(1.06);
    transform-origin: 50% 60%;
  }
  .cinematic {
    --hud-scale: 1.08;
    --hud-font: 14px;
  }
  .cinematic .arena :global(.fight-scene) {
    transform: none;
  }
  .emperor-label {
    position: absolute;
    z-index: 21;
    left: 56px;
    top: 188px;
    color: #ff7979;
    font:
      700 18px/1 Arial,
      sans-serif;
    letter-spacing: 5px;
    text-shadow: 0 2px 10px #000;
  }
</style>
