<script lang="ts">
  import type { Shot } from '../fighting-chrollo-intro/timeline'
  import type { BuiltSegment, HeroConfig } from '../fighting-chrollo-intro/hero'
  import type { FightState } from '$lib/fighting/types'

  /**
   * Tournament HUD for a duel: life with a damage trail, aura, timer, combo counters,
   * move callouts and the round calls. Everything is read from the engine state on screen.
   */
  let {
    shot,
    hero,
    segment,
  }: { shot: Shot; mask: number; hero: HeroConfig; segment: BuiltSegment | undefined } = $props()

  const SITE = 'exploreblackwhale.com/fighting'
  const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3)
  const slam = (local: number, at = 0) => {
    const t = (local - at) / 5
    if (t < 0) return 'opacity:0'
    const s = t >= 1 ? 1 : 2.6 - 1.6 * ease(t) - Math.sin(t * Math.PI) * 0.08
    return `opacity:${Math.min(1, t * 2.5)};transform:scale(${s})`
  }
  const frameOf = (states: FightState[], sim: number) =>
    states[Math.max(0, Math.min(states.length - 1, Math.floor(sim)))]
  let sim = $derived(shot.kind === 'clip' ? shot.sim : 0)
  let state = $derived(segment && shot.kind === 'clip' ? frameOf(segment.states, sim) : undefined)
  /** The trail shows where the bar was a third of a second ago. */
  let trail = $derived(segment ? frameOf(segment.states, sim - 20) : undefined)
  let fight = $derived(Boolean(segment?.id.startsWith('fight')))
  let opening = $derived(
    (segment?.id === 'fight-1' || segment?.id === 'fight-1-1') && shot.kind === 'clip'
      ? shot.local
      : -1,
  )
  let filming = $derived(Boolean(segment?.victory?.length))
  let knocked = $derived(state?.phase === 'finished' && !filming)
  let fx = $derived(shot.kind === 'clip' ? shot.fx : undefined)
  let callout = $derived(
    shot.kind === 'clip' && shot.beat && shot.beat.age < 34 && opening < 0 ? shot.beat : null,
  )
  const pct = (v: number) => `${Math.max(0, Math.min(100, v * 100))}%`
  type Side = 'player' | 'opponent'
  const life = (s: FightState, side: Side) => s[side].health / s[side].maxHealth
  /** Hisoka stays on the left whichever seat the passage gives him. */
  const seats = (s: FightState): [Side, Side] =>
    s.player.id === 'hisoka' ? ['player', 'opponent'] : ['opponent', 'player']
  const NAME: Record<string, string> = { hisoka: 'HISOKA', chrollo: 'CHROLLO' }
  let winner = $derived(
    state?.winner === 'player' || state?.winner === 'opponent' ? NAME[state[state.winner].id] : '',
  )
</script>

{#if shot.kind === 'clip' && fx}
  <div class="lines" style={`opacity:${fx.lines * 0.85}`}></div>
  <div class="vignette" style={`opacity:${0.45 + fx.split * 0.25}`}></div>
  <div class="split" style={`opacity:${Math.min(0.7, fx.split * 0.45)}`}></div>
  <div class="flash" style={`opacity:${fx.flash}`}></div>
{/if}

{#if shot.kind === 'clip' && !fight}
  <!-- The entrances: a name for each, then the pair's own lines as subtitles. -->
  <div class="bars"></div>
  <div class="intro">
    {#if segment?.id === 'entrance-1'}
      <div class="name" style={slam(shot.local, 6)}>HISOKA</div>
      <div class="kicker" style={slam(shot.local, 12)}>THE MAGICIAN</div>
    {:else if segment?.id === 'entrance-2'}
      <div class="name gold" style={slam(shot.local, 6)}>CHROLLO</div>
      <div class="kicker" style={slam(shot.local, 12)}>LEADER OF THE PHANTOM TROUPE</div>
    {:else}
      <div class="kicker" style={slam(shot.local, 2)}>{hero.kicker}</div>
      <div class="name small" style={slam(shot.local, 8)}>HISOKA</div>
      <div class="vs small" style={slam(shot.local, 12)}>VS</div>
      <div class="name gold small" style={slam(shot.local, 16)}>CHROLLO</div>
    {/if}
  </div>
  {#if shot.beat?.line}<div class="subtitle">{shot.beat.line}</div>{/if}
{:else if shot.kind === 'clip' && state && trail}
  {#if shot.portrait}<div class="bars"></div>{/if}
  {#if !filming && !shot.portrait}
    {@const [left, right] = seats(state)}
    <div class="hud">
      {#each [left, right] as side, i (side)}
        <div class="side" class:right={i === 1}>
          <div class="bar">
            <i class="trail" style={`width:${pct(life(trail, side))}`}></i>
            <i
              class="life"
              class:low={life(state, side) < 0.25}
              style={`width:${pct(life(state, side))}`}
            ></i>
          </div>
          <div class="aura"><i style={`width:${pct(state[side].aura / 100)}`}></i></div>
          <div class="who">{NAME[state[side].id]}</div>
        </div>
      {/each}
      <div class="timer">R1</div>
    </div>
    <!-- A combo counter sits on the side of the fighter landing it. -->
    {#if state[right].comboHits >= 2}
      <div class="combo left"><b>{state[right].comboHits}</b><span>HITS</span></div>
    {/if}
    {#if state[left].comboHits >= 2}
      <div class="combo right"><b>{state[left].comboHits}</b><span>HITS</span></div>
    {/if}
  {/if}
  {#if opening >= 0 && opening < 40}
    <div class="call" style={slam(opening, 0)}>ROUND 1</div>
  {:else if opening >= 40 && opening < 64}
    <div class="call fight" style={slam(opening, 40)}>FIGHT!</div>
  {/if}
  {#if callout && !knocked && !callout.word && callout.line}
    <div class="subtitle">{callout.line}</div>
  {:else if callout && !knocked}
    <div class="callout" style={`opacity:${callout.age > 28 ? 1 - (callout.age - 28) / 6 : 1}`}>
      {#if callout.word}<b style={slam(callout.age)}>{callout.word}</b>{/if}
      {#if callout.line}<span style={slam(callout.age, 3)}>{callout.line}</span>{/if}
    </div>
  {/if}
  {#if knocked}
    <div class="call ko" style={slam(shot.local, 0)}>K.O.</div>
  {/if}
  {#if filming && winner && shot.local > shot.length - 40 && segment?.victory?.some((key) => key.elapsed >= 8)}
    <div class="winner" style={slam(shot.local, shot.length - 40)}>{winner} WINS</div>
  {/if}
  <div class="site">{SITE}</div>
{:else if shot.kind !== 'clip'}
  <div class="card">
    <div class="kicker" style={slam(shot.local, 0)}>TO BE CONTINUED</div>
    <div class="name small" style={slam(shot.local, 6)}>HISOKA</div>
    <div class="vs small" style={slam(shot.local, 12)}>VS</div>
    <div class="name gold small" style={slam(shot.local, 18)}>CHROLLO</div>
    <div class="url" style={slam(shot.local, 30)}>{SITE}</div>
  </div>
{/if}

<style>
  .lines,
  .vignette,
  .split,
  .flash,
  .card {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .lines {
    background: repeating-conic-gradient(
      from 0deg at 50% 52%,
      rgba(255, 255, 255, 0.5) 0deg 0.6deg,
      transparent 0.6deg 7deg
    );
    mask-image: radial-gradient(circle at 50% 52%, transparent 28%, black 70%);
  }
  .vignette {
    background: radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0, 0, 0, 0.9) 100%);
  }
  .split {
    mix-blend-mode: screen;
    background:
      linear-gradient(90deg, rgba(255, 0, 70, 0.35), transparent 18%),
      linear-gradient(270deg, rgba(0, 220, 255, 0.35), transparent 18%);
  }
  .flash {
    background: #fff;
  }
  .hud {
    position: absolute;
    top: 46px;
    left: 18px;
    right: 18px;
    display: flex;
    gap: 70px;
  }
  .side {
    flex: 1;
  }
  .bar {
    position: relative;
    height: 34px;
    border: 3px solid #fff;
    border-radius: 4px;
    background: #2a0610;
    overflow: hidden;
    transform: skewX(-14deg);
  }
  .side.right .bar,
  .side.right .aura {
    transform: skewX(14deg) scaleX(-1);
  }
  .bar i {
    position: absolute;
    inset: 0 auto 0 0;
  }
  .bar .trail {
    background: #fff4c2;
  }
  .bar .life {
    background: linear-gradient(180deg, #ffe15a, #f0a400);
  }
  .bar .life.low {
    background: linear-gradient(180deg, #ff5a5a, #c4001d);
  }
  .aura {
    height: 12px;
    margin-top: 6px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.15);
    overflow: hidden;
    transform: skewX(-14deg);
  }
  .aura i {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #6f3cff, #d77bff);
  }
  .who {
    margin-top: 8px;
    font:
      italic 36px/1 Impact,
      'Arial Black',
      sans-serif;
    color: #fff;
    text-shadow: 0 3px 0 #000;
  }
  .side.right .who {
    text-align: right;
  }
  .timer {
    position: absolute;
    left: 50%;
    top: -6px;
    transform: translateX(-50%);
    font:
      60px/1 Impact,
      'Arial Black',
      sans-serif;
    color: #fff;
    -webkit-text-stroke: 3px #000;
  }
  .combo {
    position: absolute;
    top: 210px;
    display: flex;
    flex-direction: column;
    font:
      italic 1px/1 Impact,
      'Arial Black',
      sans-serif;
    color: #fff;
    -webkit-text-stroke: 3px #000;
  }
  .combo.left {
    left: 30px;
  }
  .combo.right {
    right: 30px;
    align-items: flex-end;
  }
  .combo b {
    font-size: 110px;
    color: #ffd23a;
  }
  .combo span {
    font-size: 40px;
  }
  .call {
    position: absolute;
    left: 0;
    right: 0;
    top: 36%;
    text-align: center;
    font:
      italic 170px/1 Impact,
      'Arial Black',
      sans-serif;
    color: #fff;
    -webkit-text-stroke: 6px #000;
    text-shadow:
      -8px 0 0 #ff1e50,
      8px 0 0 #00e1ff;
  }
  .call.fight {
    color: #ffd23a;
  }
  .call.ko {
    font-size: 260px;
    color: #ff2b2b;
  }
  .callout {
    position: absolute;
    left: 24px;
    right: 24px;
    top: 330px;
    text-align: center;
  }
  .callout b {
    display: block;
    font:
      italic 112px/0.95 Impact,
      'Arial Black',
      sans-serif;
    color: #fff;
    -webkit-text-stroke: 4px #000;
    text-shadow:
      -6px 0 0 #ff1e50,
      6px 0 0 #00e1ff,
      0 12px 30px #000;
  }
  .callout span {
    display: inline-block;
    margin-top: 14px;
    padding: 8px 16px;
    background: #ffd23a;
    color: #05070b;
    font:
      34px/1.1 Impact,
      'Arial Black',
      sans-serif;
  }
  .winner {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 220px;
    text-align: center;
    font:
      italic 110px/1 Impact,
      'Arial Black',
      sans-serif;
    color: #ffd23a;
    -webkit-text-stroke: 4px #000;
  }
  .bars {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(180deg, #000 0 9%, transparent 9% 91%, #000 91% 100%);
  }
  .subtitle {
    position: absolute;
    left: 40px;
    right: 40px;
    bottom: 200px;
    text-align: center;
    font:
      italic 40px/1.25 Georgia,
      'Times New Roman',
      serif;
    color: #fff;
    text-shadow:
      0 2px 6px #000,
      0 0 2px #000;
  }
  .site {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 40px;
    text-align: center;
    font:
      26px/1 Impact,
      'Arial Black',
      sans-serif;
    color: rgba(255, 255, 255, 0.85);
    text-shadow: 0 2px 0 #000;
  }
  .intro {
    position: absolute;
    left: 0;
    right: 0;
    top: 150px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .name {
    font:
      italic 170px/0.9 Impact,
      'Arial Black',
      sans-serif;
    color: #fff;
    -webkit-text-stroke: 4px #000;
    text-shadow:
      -7px 0 0 #ff1e50,
      7px 0 0 #00e1ff;
  }
  .name.gold {
    color: #d9b674;
  }
  .name.small {
    font-size: 130px;
  }
  .vs {
    font:
      italic 120px/1 Impact,
      'Arial Black',
      sans-serif;
    color: #ffd23a;
    -webkit-text-stroke: 4px #000;
  }
  .vs.small {
    font-size: 80px;
  }
  .kicker {
    font:
      34px/1 Impact,
      'Arial Black',
      sans-serif;
    color: #fff;
    letter-spacing: 2px;
    text-shadow: 0 3px 0 #000;
  }
  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: radial-gradient(circle at 50% 45%, #2a1030, #05070b 70%);
  }
  .url {
    margin-top: 26px;
    padding: 14px 22px;
    background: #ffd23a;
    color: #05070b;
    font:
      38px/1 Impact,
      'Arial Black',
      sans-serif;
  }
</style>
