<script lang="ts">
  const dossiers = [
    { index: '01', title: 'Spatial intelligence', copy: 'Navigate five tiers and inspect who is where at any point in the voyage.', href: '/ship', tag: 'LIVE MAP' },
    { index: '02', title: 'Canonical sequence', copy: 'Trace each confrontation, alliance, and transfer in narrative order.', href: '/timeline', tag: 'EVENT LOG' },
    { index: '03', title: 'Subjective truth', copy: 'See the same world through different minds, memories, and assumptions.', href: '/perspectives', tag: 'KNOWLEDGE' }
  ];
</script>

<svelte:head>
  <title>Black Whale — Succession Archive</title>
  <meta name="description" content="Navigate the people, places, knowledge, and Nen systems of the Black Whale Succession War." />
</svelte:head>

<div class="home-page">
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">Kakin Royal Expedition · Voyage 001</p>
      <h1><span>Enter the</span> Black Whale</h1>
      <p class="lede">A living intelligence archive for the Succession War—mapping bodies, consciousness, Nen, and incomplete truths across one impossible voyage.</p>

      <div class="hero-actions">
        <a class="primary-action" href="/ship"><span>Explore the ship</span><i aria-hidden="true">↗</i></a>
        <a class="secondary-action" href="/characters">Open passenger registry</a>
      </div>

      <div class="transmission" aria-label="Archive transmission status">
        <span class="signal"><i></i><i></i><i></i><i></i></span>
        <span><strong>Archive online</strong><small>Canonical records synchronized</small></span>
      </div>
    </div>

    <div class="ship-visual" aria-label="Black Whale schematic with five navigable tiers">
      <div class="coordinate top">N 47° 18′ 09″</div>
      <div class="coordinate side">BW / SECTIONAL</div>
      <svg viewBox="0 0 760 560" role="img" aria-labelledby="ship-title ship-desc">
        <title id="ship-title">Black Whale sectional schematic</title>
        <desc id="ship-desc">Five ship tiers shown as navigable horizontal sections.</desc>
        <defs>
          <linearGradient id="hull" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#17262d"/><stop offset="1" stop-color="#0b1217"/>
          </linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <path class="hull-shadow" d="M380 47c47 0 74 42 84 77 118 13 199 74 221 172 18 82-10 166-90 203-79 37-351 37-430 0-80-37-108-121-90-203 22-98 103-159 221-172 10-35 37-77 84-77Z"/>
        <path class="hull" d="M380 47c47 0 74 42 84 77 118 13 199 74 221 172 18 82-10 166-90 203-79 37-351 37-430 0-80-37-108-121-90-203 22-98 103-159 221-172 10-35 37-77 84-77Z"/>
        <path class="whale-mark" d="M147 273c39-19 86-26 130-17-42 8-71 27-92 58-22-3-43-14-58-31l20-10Zm466 0c-39-19-86-26-130-17 42 8 71 27 92 58 22-3 43-14 58-31l-20-10Z"/>
        <g class="tiers">
          <a href="/ship?tier=tier-1" aria-label="Open Tier 1"><path d="M297 125h166l68 49H229l68-49Z"/><text x="380" y="157">TIER 01</text></a>
          <a href="/ship?tier=tier-2" aria-label="Open Tier 2"><path d="M211 181h338c29 16 54 37 73 62H138c19-25 44-46 73-62Z"/><text x="380" y="219">TIER 02</text></a>
          <a href="/ship?tier=tier-3" aria-label="Open Tier 3"><path d="M130 251h500c14 21 22 45 25 71H105c3-26 11-50 25-71Z"/><text x="380" y="293">TIER 03</text></a>
          <a href="/ship?tier=tier-4" aria-label="Open Tier 4"><path d="M104 330h552c0 29-7 55-20 78H124c-13-23-20-49-20-78Z"/><text x="380" y="376">TIER 04</text></a>
          <a href="/ship?tier=tier-5" aria-label="Open Tier 5"><path d="M130 416h500c-17 34-48 59-92 72H222c-44-13-75-38-92-72Z"/><text x="380" y="458">TIER 05</text></a>
        </g>
        <circle class="scanner" cx="380" cy="293" r="177"/>
        <path class="scanner-line" d="M380 293 500 174"/>
        <circle class="core" cx="380" cy="293" r="4"/>
      </svg>
      <div class="visual-legend"><span><i></i> Select a tier</span><span>Scale 1:2800</span></div>
    </div>

    <div class="hero-index" aria-hidden="true">001</div>
  </section>

  <section class="metrics reveal-on-scroll" aria-label="Archive metrics">
    <div><span>05</span><p>Ship tiers</p></div>
    <div><span>100+</span><p>Tracked passengers</p></div>
    <div><span>03</span><p>Truth layers</p></div>
    <div><span>∞</span><p>Competing motives</p></div>
  </section>

  <section class="manifest reveal-on-scroll">
    <header>
      <div><p class="eyebrow">Intelligence architecture</p><h2>One voyage.<br />Many realities.</h2></div>
      <p>The archive never treats information as absolute. Every record belongs to a time, a source, and a point of view.</p>
    </header>

    <div class="dossier-grid">
      {#each dossiers as dossier}
        <a href={dossier.href} class="dossier-card">
          <span class="index">{dossier.index}</span>
          <span class="tag">{dossier.tag}</span>
          <h3>{dossier.title}</h3>
          <p>{dossier.copy}</p>
          <i aria-hidden="true">Explore ↗</i>
        </a>
      {/each}
    </div>
  </section>

  <section class="closing reveal-on-scroll">
    <p class="eyebrow">Current operational theater</p>
    <h2>The ship is moving.<br />Knowledge is not.</h2>
    <a href="/timeline">Begin with the first recorded event <span>→</span></a>
  </section>
</div>

<style>
  .home-page { overflow: hidden; }
  .hero { position: relative; display: grid; min-height: calc(100svh - var(--header-height)); grid-template-columns: minmax(0, .9fr) minmax(30rem, 1.1fr); align-items: center; gap: clamp(2rem, 6vw, 7rem); padding: clamp(3rem, 7vw, 7rem) var(--page-gutter); }
  .hero::before { position: absolute; top: 12%; bottom: 12%; left: 50%; width: 1px; background: linear-gradient(transparent, var(--line-default), transparent); content: ''; opacity: .5; }
  .hero-copy { position: relative; z-index: 2; max-width: 42rem; }
  h1 { margin: .8rem 0 1.4rem; font-size: clamp(4.4rem, 9.4vw, 9rem); font-weight: 500; letter-spacing: -.06em; line-height: .72; text-transform: uppercase; }
  h1 span { display: block; color: var(--text-muted); font-size: .32em; font-weight: 400; letter-spacing: .04em; line-height: 1.15; }
  .lede { max-width: 37rem; color: var(--text-secondary); font-size: clamp(.95rem, 1.4vw, 1.12rem); line-height: 1.75; }
  .hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .7rem 1.2rem; margin-top: 2.2rem; }
  .hero-actions a { text-decoration: none; }
  .primary-action { display: flex; min-width: 13rem; justify-content: space-between; gap: 2rem; padding: .9rem 1rem; border: 1px solid var(--accent-gold); border-radius: .35rem; background: var(--accent-gold); color: #091014; font-size: .72rem; font-weight: 700; text-transform: uppercase; transition: transform .25s var(--ease-out), box-shadow .25s; }
  .primary-action:hover { transform: translateY(-3px); box-shadow: 0 14px 35px rgba(200,169,86,.2); }
  .primary-action i { font-style: normal; }
  .secondary-action { padding: .8rem .25rem; border-bottom: 1px solid var(--line-strong); color: var(--text-secondary); font-size: .7rem; }
  .secondary-action:hover { color: var(--text-primary); }
  .transmission { display: flex; align-items: center; gap: .8rem; margin-top: 3.3rem; color: var(--text-muted); }
  .transmission > span:last-child { display: grid; gap: .15rem; }
  .transmission strong { color: var(--state-known); font: 600 .56rem/1 var(--font-mono); letter-spacing: .1em; text-transform: uppercase; }
  .transmission small { font: .5rem/1.2 var(--font-mono); }
  .signal { display: flex; height: 1.1rem; align-items: end; gap: 2px; }
  .signal i { display: block; width: 2px; background: var(--state-known); animation: signal 1.3s ease-in-out infinite alternate; }
  .signal i:nth-child(1) { height: 35%; }.signal i:nth-child(2) { height: 70%; animation-delay: -.4s; }.signal i:nth-child(3) { height: 100%; animation-delay: -.8s; }.signal i:nth-child(4) { height: 55%; animation-delay: -.2s; }
  .ship-visual { position: relative; max-width: 47rem; justify-self: center; }
  .ship-visual svg { display: block; width: 100%; overflow: visible; filter: drop-shadow(0 35px 55px rgba(0,0,0,.45)); }
  .hull-shadow { fill: rgba(0,0,0,.45); transform: translateY(18px); }
  .hull { fill: url(#hull); stroke: rgba(216,191,118,.35); stroke-width: 1; }
  .whale-mark { fill: rgba(112,189,193,.1); stroke: rgba(112,189,193,.35); stroke-width: 1; }
  .tiers a { color: inherit; }
  .tiers path { fill: rgba(15,29,36,.92); stroke: rgba(173,188,190,.2); stroke-width: 1; transition: fill .28s, stroke .28s, transform .28s; transform-origin: center; }
  .tiers text { fill: #819094; font: 600 10px var(--font-mono); letter-spacing: 3px; text-anchor: middle; pointer-events: none; transition: fill .28s; }
  .tiers a:hover path, .tiers a:focus path { fill: rgba(200,169,86,.16); stroke: var(--accent-gold); transform: scale(1.015); }
  .tiers a:hover text, .tiers a:focus text { fill: var(--accent-gold-bright); }
  .scanner { fill: none; stroke: rgba(112,189,193,.16); stroke-dasharray: 3 9; transform-origin: center; animation: rotate 36s linear infinite; }
  .scanner-line { stroke: rgba(112,189,193,.18); stroke-width: 1; transform-origin: 380px 293px; animation: rotate 9s linear infinite; }
  .core { fill: var(--accent-gold); filter: url(#glow); }
  .coordinate, .visual-legend { color: var(--text-faint); font: .5rem/1 var(--font-mono); letter-spacing: .12em; text-transform: uppercase; }
  .coordinate { position: absolute; }
  .coordinate.top { top: 4%; right: 3%; }.coordinate.side { top: 43%; left: -2rem; writing-mode: vertical-rl; }
  .visual-legend { display: flex; justify-content: space-between; padding: .7rem 1rem 0; border-top: 1px solid var(--line-subtle); }
  .visual-legend i { display: inline-block; width: .4rem; height: .4rem; margin-right: .3rem; border-radius: 50%; background: var(--accent-gold); }
  .hero-index { position: absolute; right: 1.5rem; bottom: 1rem; color: rgba(240,238,230,.035); font: 500 clamp(8rem, 20vw, 18rem)/.75 var(--font-display); pointer-events: none; }
  .metrics { display: grid; max-width: var(--container-wide); margin: 0 auto; grid-template-columns: repeat(4,1fr); padding: 0 var(--page-gutter); }
  .metrics div { display: flex; align-items: baseline; gap: .7rem; padding: 1.5rem; border-top: 1px solid var(--line-default); border-right: 1px solid var(--line-subtle); }
  .metrics div:last-child { border-right: 0; }.metrics span { color: var(--accent-gold-bright); font: 500 1.8rem/1 var(--font-display); }.metrics p { margin: 0; color: var(--text-muted); font: .55rem/1.2 var(--font-mono); letter-spacing: .08em; text-transform: uppercase; }
  .manifest { max-width: var(--container-wide); margin: 0 auto; padding: clamp(6rem, 12vw, 11rem) var(--page-gutter); }
  .manifest > header { display: grid; grid-template-columns: 1fr .65fr; align-items: end; gap: 3rem; margin-bottom: 4rem; }
  .manifest h2, .closing h2 { margin: .7rem 0 0; font-size: clamp(3.2rem, 7vw, 6.5rem); font-weight: 500; letter-spacing: -.05em; line-height: .86; text-transform: uppercase; }
  .manifest > header > p { max-width: 31rem; margin: 0; color: var(--text-secondary); line-height: 1.7; }
  .dossier-grid { display: grid; grid-template-columns: repeat(3,1fr); border-top: 1px solid var(--line-default); }
  .dossier-card { position: relative; min-height: 24rem; padding: 1.5rem; border-right: 1px solid var(--line-default); color: inherit; text-decoration: none; transition: background .3s, transform .3s var(--ease-out); }
  .dossier-card:last-child { border-right: 0; }.dossier-card:hover { background: linear-gradient(rgba(200,169,86,.07),transparent); transform: translateY(-.5rem); }
  .dossier-card .index, .dossier-card .tag { font: .56rem/1 var(--font-mono); letter-spacing: .12em; }.dossier-card .index { color: var(--text-faint); }.dossier-card .tag { position: absolute; top: 1.5rem; right: 1.5rem; color: var(--accent-gold); }
  .dossier-card h3 { max-width: 16rem; margin: 7.5rem 0 1rem; font-size: 2.2rem; line-height: .95; }.dossier-card p { max-width: 19rem; color: var(--text-muted); font-size: .8rem; line-height: 1.65; }.dossier-card > i { position: absolute; bottom: 1.5rem; color: var(--text-secondary); font: normal .58rem/1 var(--font-mono); letter-spacing: .08em; text-transform: uppercase; }
  .closing { position: relative; padding: clamp(7rem, 14vw, 13rem) var(--page-gutter); border-top: 1px solid var(--line-subtle); text-align: center; background: radial-gradient(circle at 50% 60%, rgba(37,83,89,.18),transparent 42%); }
  .closing h2 { margin-inline: auto; }.closing a { display: inline-flex; align-items: center; gap: 1rem; margin-top: 2.5rem; padding-bottom: .55rem; border-bottom: 1px solid var(--accent-gold); color: var(--accent-gold-bright); font-size: .72rem; text-decoration: none; text-transform: uppercase; }.closing a span { transition: transform .2s; }.closing a:hover span { transform: translateX(.4rem); }
  @keyframes rotate { to { transform: rotate(360deg); } } @keyframes signal { to { opacity: .35; transform: scaleY(.45); } }
  @media (max-width: 900px) { .hero { min-height: auto; grid-template-columns: 1fr; padding-top: 5rem; }.hero::before { display: none; }.ship-visual { width: min(100%,38rem); }.manifest > header { grid-template-columns: 1fr; }.dossier-grid { grid-template-columns: 1fr; }.dossier-card { min-height: 18rem; border-right: 0; border-bottom: 1px solid var(--line-default); }.dossier-card h3 { margin-top: 4.5rem; } }
  @media (max-width: 600px) { .hero { padding-inline: 1rem; }.hero h1 { font-size: clamp(4rem,22vw,6rem); }.metrics { grid-template-columns: repeat(2,1fr); padding-inline: 1rem; }.metrics div:nth-child(2) { border-right: 0; }.manifest { padding-inline: 1rem; }.visual-legend { padding-inline: 0; }.coordinate.side { display: none; } }
  @media (prefers-reduced-motion: reduce) { .scanner,.scanner-line,.signal i { animation: none; } }
</style>
