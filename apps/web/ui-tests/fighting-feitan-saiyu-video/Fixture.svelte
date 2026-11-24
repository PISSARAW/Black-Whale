<script lang="ts">
  import { tick } from 'svelte'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import { createFeitanSaiyuDemo } from './demo'

  const portrait = new URLSearchParams(window.location.search).has('portrait')
  const demo = createFeitanSaiyuDemo(portrait)
  let state = demo.initial
  let title = '1 / Le calme avant la mise à mort'
  let frame = 0
  let impactFrame = -100
  const comfort = {
    graphics: 'quality' as const,
    shake: 0.5 as const,
    camera: 0.5 as const,
    flashes: true,
    highContrast: false,
  }

  const phaseFor = (value: number) =>
    value < 90
      ? 'guard'
      : value < 240
        ? 'speed'
        : value < 390
          ? 'blade'
          : value < 540
            ? 'umbrella'
            : value < 630
              ? 'wound'
              : value < 735
                ? 'packer'
                : 'sun'

  export async function advance(count = 2) {
    for (let index = 0; index < count; index++) {
      const next = demo.advance()
      if (next.state.impact && next.state.impact.sequence !== state.impact?.sequence)
        impactFrame = next.frame
      state = next.state
      title = next.title
      frame = next.frame
    }
    await tick()
  }
  export const diagnostics = () => demo.diagnostics()
</script>

<main
  class:portrait
  class:heat={phaseFor(frame) === 'sun'}
  class:violent={['speed', 'blade', 'umbrella'].includes(phaseFor(frame))}
>
  <div class="arena">
    {#if portrait}
      <FightScene
        {state}
        {comfort}
        stageId="princes-burial-chamber"
        hideSecondaryView
        keepCombatantMarkers={false}
      />
    {:else}
      <FightLiveScene {state} {comfort} stageId="princes-burial-chamber" viewer="player" />
      <FightHud {state} language="fr" />
    {/if}
    <div class="desaturation"></div>
    <div class="speed-lines"></div>
    <div class="embers"></div>
    <div class="ink"></div>
  </div>
  {#if portrait}
    <div class="portrait-head">
      <span>BLACK WHALE CLASH</span><strong>FEITAN <i>×</i> SAIYU</strong>
    </div>
    <div class="hit" class:contact={frame - impactFrame < 4}></div>
    <section class="portrait-copy">
      <small>CHAMBRE FUNÉRAIRE DES PRINCES</small>
      {#if frame < 90}<h1>FEITAN</h1>
        <p>La garde de l’Araignée</p>
      {:else if frame < 240}<h1>VITESSE<br />FANTÔME</h1>
        <p>Rémanences et changements d’appui</p>
      {:else if frame < 390}<h1>{frame < 316 ? 'ESTOC ÉCLAIR' : 'FAUCHAGE'}</h1>
        <p>
          {state.opponent.comboHits > 0 ? `${state.opponent.comboHits} TOUCHES` : 'SABRE'} · SANS AURA
        </p>
      {:else if frame < 540}<h1>POINTE<br />CACHÉE</h1>
        <p>Feinte au parapluie</p>
      {:else if frame < 630}<h1>LA DOULEUR<br />S’ACCUMULE</h1>
      {:else if frame < 735}<h1>PAIN PACKER</h1>
        <p>L’armure apparaît</p>
      {:else}<h1>RISING SUN</h1>
        <p>HATSU · LA FOURNAISE</p>{/if}
    </section>
  {:else}
    <header>
      <span class="arc">BLACK WHALE · SALLE DE MORT DES PRINCES</span>
      <strong>FEITAN</strong><i>contre</i><strong>SAIYU</strong>
    </header>
    <section class="chapter" data-phase={phaseFor(frame)}>
      <small>ASSASSIN DE LA BRIGADE FANTÔME</small>
      <h1>{title.replace(/^\d+ \/ /, '')}</h1>
    </section>
    <footer>
      <span>« Plus vite que le regard. »</span><span
        >{String(Math.floor(frame / 60)).padStart(2, '0')} s</span
      >
    </footer>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    background: #020306;
    color: #eee9e7;
    font-family: Georgia, 'Times New Roman', serif;
    overflow: hidden;
  }
  main {
    position: relative;
    height: 100vh;
    background: #030508;
    isolation: isolate;
  }
  .arena {
    position: absolute;
    inset: 0;
    overflow: hidden;
    filter: saturate(0.68) contrast(1.18) brightness(0.78) sepia(0.08);
  }
  .desaturation,
  .speed-lines,
  .embers,
  .ink {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .desaturation {
    background: linear-gradient(
      112deg,
      rgba(4, 9, 15, 0.62),
      transparent 35%,
      rgba(42, 11, 8, 0.22)
    );
    mix-blend-mode: color;
  }
  .ink {
    box-shadow:
      inset 0 0 110px 42px #000,
      inset 0 82px 65px -42px #000,
      inset 0 -78px 55px -42px #000;
    background: repeating-linear-gradient(
      0deg,
      rgba(255, 255, 255, 0.018) 0 1px,
      transparent 1px 4px
    );
  }
  .speed-lines {
    opacity: 0;
    background: repeating-conic-gradient(
      from 82deg at 37% 54%,
      transparent 0deg 0.7deg,
      rgba(226, 236, 243, 0.2) 0.8deg 0.94deg,
      transparent 1deg 2.1deg
    );
    mask-image: radial-gradient(circle at 37% 54%, transparent 0 13%, #000 31% 100%);
  }
  .violent .arena {
    filter: saturate(0.48) contrast(1.34) brightness(0.72);
  }
  .violent .speed-lines {
    opacity: 0.72;
    animation: slash 0.16s steps(2) infinite;
  }
  .embers {
    opacity: 0;
    background:
      radial-gradient(circle at 31% 44%, rgba(255, 235, 150, 0.5) 0 2px, transparent 3px),
      radial-gradient(circle at 78% 63%, #ff5a17 0 2px, transparent 3px),
      radial-gradient(circle at 55% 28%, #ff8a28 0 1px, transparent 2px);
    background-size:
      93px 71px,
      127px 89px,
      61px 113px;
  }
  .heat .arena {
    filter: saturate(1.28) contrast(1.24) brightness(0.84) sepia(0.25);
  }
  .heat .embers {
    opacity: 0.9;
    animation: rise 1.1s linear infinite;
  }
  header {
    position: absolute;
    z-index: 4;
    inset: 0 0 auto;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    background: linear-gradient(#020308 42%, rgba(2, 3, 8, 0.86));
    border-bottom: 1px solid rgba(181, 54, 34, 0.5);
    letter-spacing: 0.12em;
  }
  header .arc {
    position: absolute;
    left: 26px;
    color: #a78f89;
    font: 9px system-ui;
    letter-spacing: 0.24em;
  }
  header strong {
    font: 700 17px system-ui;
    color: #f4f0ed;
    text-shadow: 0 0 10px #b52819;
  }
  header i {
    color: #9d3930;
    font-size: 12px;
  }
  .chapter {
    position: absolute;
    z-index: 4;
    left: 25px;
    bottom: 35px;
    max-width: 720px;
    padding: 10px 18px 12px 15px;
    border-left: 4px solid #a52e22;
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.88), rgba(0, 0, 0, 0.55) 72%, transparent);
    text-shadow: 0 2px 4px #000;
  }
  .chapter small {
    color: #d35a44;
    font: 9px system-ui;
    letter-spacing: 0.28em;
  }
  .chapter h1 {
    margin: 4px 0 0;
    font-size: 24px;
    font-weight: 600;
    letter-spacing: 0.025em;
  }
  .chapter[data-phase='sun'] {
    border-color: #ff8a27;
  }
  .chapter[data-phase='sun'] small {
    color: #ffc06c;
  }
  footer {
    position: absolute;
    z-index: 4;
    inset: auto 0 0;
    height: 25px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 26px;
    box-sizing: border-box;
    background: rgba(0, 0, 0, 0.88);
    color: #8f898a;
    font: italic 10px Georgia;
    letter-spacing: 0.12em;
  }
  @keyframes slash {
    to {
      transform: translateX(9px) rotate(0.3deg);
    }
  }
  @keyframes rise {
    to {
      background-position:
        11px -71px,
        -9px -89px,
        4px -113px;
    }
  }
  .portrait .arena {
    filter: saturate(0.78) contrast(1.15) brightness(0.93);
  }
  .portrait.heat .arena {
    filter: saturate(1.28) contrast(1.18) brightness(0.94);
  }
  .portrait .ink {
    box-shadow:
      inset 0 0 90px 18px #000,
      inset 0 -360px 160px -125px #000;
  }
  .portrait .speed-lines {
    opacity: 0.38;
  }
  .portrait-head {
    position: absolute;
    top: 8%;
    left: 8%;
    display: grid;
    gap: 7px;
    font-family: system-ui;
  }
  .portrait-head span,
  .portrait-copy small {
    color: #f4a28b;
    font: 700 12px system-ui;
    letter-spacing: 0.18em;
  }
  .portrait-head strong {
    font-size: 21px;
    letter-spacing: 0.12em;
  }
  .portrait-head i {
    color: #f06143;
    font-style: normal;
  }
  .portrait-copy {
    position: absolute;
    left: 8%;
    right: 17%;
    bottom: 18%;
    text-shadow: 0 3px 15px #000;
  }
  .portrait-copy h1 {
    margin: 7px 0;
    font:
      italic 900 clamp(36px, 8.6vw, 92px)/0.93 'Arial Black',
      system-ui;
    letter-spacing: -0.05em;
  }
  .portrait-copy p {
    margin: 10px 0 0;
    color: #ffb190;
    font: 700 16px system-ui;
  }
  .heat .portrait-copy h1 {
    color: #ffcf80;
  }
  .hit {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .hit.contact {
    box-shadow: inset 0 0 75px 12px #e7493180;
  }
</style>
