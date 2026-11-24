<script lang="ts">
  import { tick } from 'svelte'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import { createHisokaMachiDemo } from './demo'

  const demo = createHisokaMachiDemo()
  let state = $state(demo.initial)
  let title = $state('1 / Cartes physiques et frappes sans téléportation')
  let frame = $state(0)
  let chapterFrame = $derived(frame < 900 ? frame % 300 : frame - 900)
  let chapterVisible = $derived(chapterFrame < 102)
  let hisoka = $derived(frame < 900 ? state.player : state.opponent)
  let machi = $derived(frame < 900 ? state.opponent : state.player)
  let hisokaHealth = $derived(Math.max(0, (hisoka.health / hisoka.maxHealth) * 100))
  let machiHealth = $derived(Math.max(0, (machi.health / machi.maxHealth) * 100))
  const comfort = {
    graphics: 'quality' as const,
    shake: 0.45 as const,
    camera: 1 as const,
    flashes: true,
    highContrast: false,
  }

  export async function advance(count = 2) {
    for (let index = 0; index < count; index++) {
      const next = demo.advance()
      state = next.state
      title = next.title
      frame = next.frame
    }
    await tick()
  }

  export function diagnostics() {
    return demo.diagnostics()
  }
</script>

<main>
  <div class="arena">
    <FightLiveScene
      {state}
      {comfort}
      stageId="royal-salon"
      viewer={frame < 900 ? 'player' : 'opponent'}
    />
    <div class="grade"></div>
    <div class="hud">
      <div class="fighter hisoka">
        <div class="identity"><strong>HISOKA</strong><span>{Math.ceil(hisoka.aura)}</span></div>
        <div class="meter"><i style:width={`${hisokaHealth}%`}></i></div>
      </div>
      <div class="round">
        <small>BLACK WHALE CLASH</small>
        <strong>HISOKA <em>VS</em> MACHI</strong>
      </div>
      <div class="fighter machi">
        <div class="identity"><span>{Math.ceil(machi.aura)}</span><strong>MACHI</strong></div>
        <div class="meter"><i style:width={`${machiHealth}%`}></i></div>
      </div>
    </div>
    {#if chapterVisible}
      <section class="chapter" style:--age={chapterFrame}>
        <span>0{Math.min(4, Math.floor(frame / 300) + 1)}</span>
        <div>
          <small>HISOKA · GRAMMAIRE DE COMBAT</small>
          <h1>{title.replace(/^\d \/ /, '')}</h1>
        </div>
      </section>
    {/if}
    <div class="letterbox top"></div>
    <div class="letterbox bottom"></div>
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #0a0c14;
    color: #f4eef4;
    font-family: system-ui;
  }
  main {
    height: 100vh;
    overflow: hidden;
  }
  .arena {
    position: relative;
    height: 100%;
    overflow: hidden;
    background: #09080d;
  }
  .arena :global(.fight-scene) {
    position: absolute;
    inset: 0;
  }
  .grade {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 50% 48%, transparent 42%, rgb(5 2 10 / 0.38) 100%),
      linear-gradient(180deg, rgb(34 12 42 / 0.1), transparent 42%, rgb(8 4 13 / 0.18));
    box-shadow: inset 0 0 110px rgb(3 1 7 / 0.62);
  }
  .hud {
    position: absolute;
    top: 46px;
    left: 62px;
    right: 62px;
    z-index: 4;
    display: grid;
    grid-template-columns: 1fr 260px 1fr;
    align-items: end;
    gap: 24px;
    filter: drop-shadow(0 3px 8px rgb(0 0 0 / 0.8));
  }
  .identity {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 7px;
    color: #efe9ee;
    font-size: 14px;
    letter-spacing: 0.16em;
  }
  .identity span {
    color: #d7c2dd;
    font: 600 11px/1 system-ui;
  }
  .meter {
    height: 13px;
    overflow: hidden;
    border: 1px solid rgb(255 255 255 / 0.68);
    background: rgb(8 6 12 / 0.74);
    transform: skewX(-12deg);
  }
  .meter i {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #7d346f, #f3bbdc 45%, #fff0c9);
    box-shadow: 0 0 14px #d564c4;
    transition: width 80ms linear;
  }
  .machi .meter {
    display: flex;
    justify-content: flex-end;
    transform: skewX(12deg);
  }
  .machi .meter i {
    background: linear-gradient(90deg, #fff1d2, #db9ad2 55%, #62345f);
  }
  .round {
    text-align: center;
    color: #f3edf2;
  }
  .round small {
    display: block;
    margin-bottom: 5px;
    color: #c9a4ca;
    font-size: 9px;
    letter-spacing: 0.3em;
  }
  .round strong {
    font:
      italic 800 18px/1 Georgia,
      serif;
    letter-spacing: 0.08em;
  }
  .round em {
    padding: 0 8px;
    color: #e3b45d;
    font-size: 12px;
  }
  .chapter {
    position: absolute;
    left: 8.5%;
    bottom: 13%;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 22px;
    max-width: 760px;
    padding: 18px 28px 20px 20px;
    border-left: 4px solid #e6af56;
    background: linear-gradient(90deg, rgb(9 5 14 / 0.88), rgb(9 5 14 / 0.56), transparent);
    animation: chapter-in 500ms ease-out both;
  }
  .chapter > span {
    color: #e6af56;
    font:
      italic 900 47px/1 Georgia,
      serif;
  }
  .chapter small {
    color: #d59dcc;
    font-size: 10px;
    letter-spacing: 0.24em;
  }
  .chapter h1 {
    margin: 7px 0 0;
    color: white;
    font:
      italic 800 clamp(20px, 2vw, 32px)/1.05 Georgia,
      serif;
    text-shadow: 0 2px 8px black;
  }
  .letterbox {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 3;
    height: 24px;
    background: #050408;
  }
  .letterbox.top {
    top: 0;
  }
  .letterbox.bottom {
    bottom: 0;
  }
  @keyframes chapter-in {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
</style>
