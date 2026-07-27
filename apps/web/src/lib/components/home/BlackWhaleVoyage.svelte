<script lang="ts">
  const portholes = Array.from({ length: 24 }, (_, index) => ({
    x: 268 + (index % 8) * 54,
    y: 302 + Math.floor(index / 8) * 42,
    delay: `${(index % 7) * -0.43}s`,
  }))
</script>

<div class="voyage" aria-label="Black Whale 1 navigating across the ocean">
  <div class="atmosphere" aria-hidden="true"></div>
  <div class="coordinate north">N 47° 18′ 09″</div>
  <div class="coordinate vessel">BW.01 / UNDERWAY</div>

  <svg viewBox="0 0 920 610" role="img" aria-labelledby="voyage-title voyage-description">
    <title id="voyage-title">Black Whale 1 at sea</title>
    <desc id="voyage-description"
      >The colossal whale-shaped expedition vessel carries the Tier 1 royal ship above its five
      decks while moving through dark ocean swells.</desc
    >
    <defs>
      <linearGradient id="night-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#14242b" />
        <stop offset=".58" stop-color="#0c171d" />
        <stop offset="1" stop-color="#070d11" />
      </linearGradient>
      <linearGradient id="whale-hull" x1=".2" y1="0" x2=".7" y2="1">
        <stop offset="0" stop-color="#22353d" />
        <stop offset=".46" stop-color="#101b21" />
        <stop offset="1" stop-color="#05090c" />
      </linearGradient>
      <linearGradient id="royal-hull" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#b6b4a8" />
        <stop offset="1" stop-color="#484f50" />
      </linearGradient>
      <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#17363e" />
        <stop offset="1" stop-color="#07151a" />
      </linearGradient>
      <radialGradient id="horizon-glow">
        <stop offset="0" stop-color="#78b7ba" stop-opacity=".22" />
        <stop offset="1" stop-color="#78b7ba" stop-opacity="0" />
      </radialGradient>
      <filter id="soft-glow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="ship-shadow" x="-30%" y="-30%" width="160%" height="180%">
        <feDropShadow dx="0" dy="24" stdDeviation="18" flood-color="#000" flood-opacity=".65" />
      </filter>
      <clipPath id="hull-clip">
        <path
          d="M119 295C134 220 198 170 304 151c116-21 314-12 421 39 80 38 123 96 111 160-13 68-78 111-178 130-138 27-373 15-479-41-68-36-75-91-60-144Z"
        />
      </clipPath>
    </defs>

    <rect width="920" height="610" fill="url(#night-sky)" />
    <ellipse cx="490" cy="324" rx="440" ry="210" fill="url(#horizon-glow)" />
    <g class="stars" aria-hidden="true">
      <circle cx="108" cy="95" r="1" /><circle cx="182" cy="64" r=".7" /><circle
        cx="738"
        cy="81"
        r=".8"
      />
      <circle cx="831" cy="128" r="1" /><circle cx="656" cy="55" r=".6" /><circle
        cx="477"
        cy="75"
        r=".7"
      />
    </g>

    <g class="distant-sea" aria-hidden="true">
      <path d="M0 414Q110 390 222 414t224 0 224 0 250 0v196H0Z" fill="#0b242b" />
      <path
        d="M-80 446Q38 414 155 446t236 0 236 0 236 0 237 0"
        fill="none"
        stroke="#32606a"
        stroke-opacity=".4"
        stroke-width="3"
      />
    </g>

    <g class="ship" filter="url(#ship-shadow)">
      <g class="wake" aria-hidden="true">
        <path d="M82 418C196 383 274 405 375 448 252 435 150 451 51 482" />
        <path d="M101 438C206 421 291 442 350 472 225 458 143 473 64 501" />
      </g>

      <path
        class="tail-fin"
        d="M754 248c60-61 111-72 140-52-20 13-35 34-39 61 23 17 35 39 34 67-45-6-88-31-126-72Z"
      />
      <path
        class="main-hull"
        d="M119 295C134 220 198 170 304 151c116-21 314-12 421 39 80 38 123 96 111 160-13 68-78 111-178 130-138 27-373 15-479-41-68-36-75-91-60-144Z"
      />
      <path class="hull-ridge" d="M139 281c95-76 215-98 373-92 132 5 238 37 302 96" />
      <path
        class="belly"
        d="M142 387c112 59 309 77 500 49 85-12 142-39 178-79-19 65-83 105-178 123-136 26-362 14-463-41-27-14-48-32-61-52 8-4 16-4 24 0Z"
      />
      <path class="mouth" d="M116 331c49 24 98 31 151 20-44 30-93 39-145 24" />
      <circle class="eye-ring" cx="193" cy="274" r="13" />
      <circle class="eye" cx="193" cy="274" r="4" />
      <path class="flipper" d="M504 440c35 50 36 89 5 119-24-31-40-68-49-111Z" />

      <g clip-path="url(#hull-clip)" class="tier-lines" aria-hidden="true">
        <path d="M155 292H815" /><path d="M140 334H829" /><path d="M145 376H818" /><path
          d="M166 418H774"
        />
      </g>

      <g class="portholes" aria-hidden="true">
        {#each portholes as porthole, portholeIndex (portholeIndex)}
          <circle cx={porthole.x} cy={porthole.y} r="3.2" style={`--delay:${porthole.delay}`} />
        {/each}
      </g>

      <g class="royal-platform">
        <path
          class="pool-rim"
          d="M284 177c40-31 101-47 183-47 89 0 158 18 202 56-45 23-111 34-198 32-83-2-146-15-187-41Z"
        />
        <path
          class="pool"
          d="M316 174c39-20 90-30 153-29 66 1 118 12 157 35-38 15-89 22-154 21-66-1-118-10-156-27Z"
        />
        <g class="tier-one">
          <path d="M368 150h212l39 28H342l26-28Z" fill="url(#royal-hull)" />
          <path d="M393 121h147l34 29H368l25-29Z" />
          <path d="M424 94h78l23 27H403l21-27Z" />
          <path d="M448 75h34v19h-34Z" />
          <path d="M459 53h10v22h-10Z" />
          <path class="royal-windows" d="M388 162h207M408 134h145M430 106h75" />
          <path class="mast" d="M515 95V58m0 8 30 13m-30-7-26 10" />
        </g>
      </g>

      <g class="tier-labels" aria-hidden="true">
        <text x="739" y="284">T2</text><text x="753" y="326">T3</text><text x="748" y="369">T4</text
        ><text x="718" y="414">T5</text>
      </g>
    </g>

    <g class="foreground-sea" aria-hidden="true">
      <path d="M-90 478Q40 429 170 478t260 0 260 0 260 0 260 0v160H-90Z" fill="url(#sea)" />
      <path class="wave-line a" d="M-110 486Q30 440 170 486t280 0 280 0 280 0 280 0" />
      <path class="wave-line b" d="M-170 528Q-20 480 130 528t300 0 300 0 300 0 300 0" />
      <path
        class="foam"
        d="M84 480c71-27 135-25 205 0-55-7-107 0-155 22m482-8c71-18 136-14 201 13"
      />
    </g>
  </svg>

  <div class="telemetry" aria-hidden="true">
    <span><i></i> Ocean route stable</span><span>1,500 M / 200,000 PAX</span>
  </div>
</div>

<style>
  .voyage {
    position: relative;
    width: 100%;
    overflow: hidden;
    border: 1px solid rgba(197, 181, 128, 0.18);
    border-radius: 0.7rem;
    background: #081015;
    box-shadow: 0 35px 80px rgba(0, 0, 0, 0.42);
    isolation: isolate;
  }
  .voyage::before {
    position: absolute;
    z-index: 4;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
      110deg,
      rgba(255, 255, 255, 0.035),
      transparent 24%,
      transparent 76%,
      rgba(8, 12, 15, 0.3)
    );
    content: '';
    pointer-events: none;
  }
  .voyage svg {
    display: block;
    width: 100%;
    height: auto;
  }
  .atmosphere {
    position: absolute;
    z-index: 2;
    inset: 0;
    background:
      repeating-linear-gradient(
        90deg,
        transparent 0,
        transparent 79px,
        rgba(142, 177, 177, 0.035) 80px
      ),
      repeating-linear-gradient(
        0deg,
        transparent 0,
        transparent 79px,
        rgba(142, 177, 177, 0.025) 80px
      );
    mix-blend-mode: screen;
    pointer-events: none;
  }
  .coordinate,
  .telemetry {
    position: absolute;
    z-index: 5;
    color: #708086;
    font: 0.47rem/1 var(--font-mono);
    letter-spacing: 0.11em;
    text-transform: uppercase;
  }
  .coordinate.north {
    top: 1rem;
    right: 1rem;
  }
  .coordinate.vessel {
    top: 1rem;
    left: 1rem;
    color: #c8a956;
  }
  .telemetry {
    right: 1rem;
    bottom: 0.85rem;
    left: 1rem;
    display: flex;
    justify-content: space-between;
  }
  .telemetry i {
    display: inline-block;
    width: 0.34rem;
    height: 0.34rem;
    margin-right: 0.35rem;
    border-radius: 50%;
    background: #70bdc1;
    box-shadow: 0 0 8px #70bdc1;
  }
  .stars circle {
    fill: #b6d2d0;
    opacity: 0.45;
    animation: twinkle 3s ease-in-out infinite alternate;
  }
  .ship {
    transform-origin: 470px 390px;
    animation: bob 6s ease-in-out infinite;
  }
  .main-hull {
    fill: url(#whale-hull);
    stroke: rgba(191, 193, 178, 0.35);
    stroke-width: 1.5;
  }
  .hull-ridge {
    fill: none;
    stroke: rgba(204, 184, 119, 0.25);
    stroke-width: 1.2;
  }
  .belly {
    fill: #070d11;
    opacity: 0.84;
  }
  .mouth {
    fill: none;
    stroke: #66777b;
    stroke-width: 2;
  }
  .eye-ring {
    fill: #111d22;
    stroke: #c8a956;
    stroke-width: 1.5;
  }
  .eye {
    fill: #e1c56c;
    filter: url(#soft-glow);
  }
  .tail-fin,
  .flipper {
    fill: #0a1217;
    stroke: rgba(185, 194, 190, 0.25);
    stroke-width: 1.2;
  }
  .tier-lines path {
    fill: none;
    stroke: rgba(132, 163, 166, 0.13);
    stroke-width: 1;
  }
  .portholes circle {
    fill: #d5bd72;
    opacity: 0.45;
    filter: url(#soft-glow);
    animation: cabin-light 3.8s ease-in-out infinite alternate;
    animation-delay: var(--delay);
  }
  .pool-rim {
    fill: #141e22;
    stroke: rgba(205, 185, 118, 0.4);
    stroke-width: 1;
  }
  .pool {
    fill: #28505a;
    stroke: #527f83;
    stroke-width: 1;
  }
  .tier-one path {
    fill: #687175;
    stroke: rgba(226, 221, 194, 0.5);
    stroke-width: 1;
  }
  .tier-one .royal-windows {
    fill: none;
    stroke: #d8c879;
    stroke-width: 2;
    stroke-dasharray: 4 7;
  }
  .tier-one .mast {
    fill: none;
    stroke: #a8afaa;
    stroke-width: 1;
  }
  .tier-labels text {
    fill: #69797c;
    font: 600 8px var(--font-mono);
    letter-spacing: 2px;
  }
  .wake path {
    fill: none;
    stroke: #b7d0ce;
    stroke-linecap: round;
    stroke-width: 5;
    opacity: 0.36;
    animation: wake 2.8s ease-in-out infinite;
  }
  .wake path + path {
    stroke-width: 2;
    animation-delay: -1.1s;
  }
  .distant-sea {
    animation: sea-drift 9s linear infinite;
  }
  .foreground-sea {
    transform-origin: center;
    animation: swell 5s ease-in-out infinite;
  }
  .wave-line {
    fill: none;
    stroke: #5c8c92;
    stroke-width: 3;
    opacity: 0.48;
  }
  .wave-line.a {
    animation: wave 7s linear infinite;
  }
  .wave-line.b {
    animation: wave 9s linear infinite reverse;
  }
  .foam {
    fill: none;
    stroke: #c1d5d2;
    stroke-width: 4;
    stroke-linecap: round;
    opacity: 0.32;
  }
  .royal-platform {
    transform-origin: 470px 180px;
  }
  .ship:hover .royal-platform {
    animation: royal-signal 1.4s ease-in-out infinite alternate;
  }
  @keyframes bob {
    0%,
    100% {
      transform: translateY(1px) rotate(-0.25deg);
    }
    50% {
      transform: translateY(-8px) rotate(0.35deg);
    }
  }
  @keyframes swell {
    0%,
    100% {
      transform: translateY(5px);
    }
    50% {
      transform: translateY(-3px);
    }
  }
  @keyframes wave {
    to {
      transform: translateX(-280px);
    }
  }
  @keyframes sea-drift {
    to {
      transform: translateX(-224px);
    }
  }
  @keyframes wake {
    50% {
      opacity: 0.6;
      transform: translateX(-16px);
    }
  }
  @keyframes twinkle {
    to {
      opacity: 0.9;
    }
  }
  @keyframes cabin-light {
    to {
      opacity: 0.9;
    }
  }
  @keyframes royal-signal {
    to {
      filter: drop-shadow(0 0 8px rgba(211, 185, 100, 0.4));
    }
  }
  @media (max-width: 600px) {
    .voyage {
      min-width: 37rem;
      transform: translateX(-18%);
    }
    .coordinate,
    .telemetry {
      display: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .ship,
    .foreground-sea,
    .distant-sea,
    .wave-line,
    .wake path,
    .stars circle,
    .portholes circle {
      animation: none;
    }
  }
</style>
