<script lang="ts">
  import { locale } from '$lib/i18n'

  const french = $derived($locale === 'fr')

  let activeArea = $state<string | null>(null)

  function inspect(area: string) {
    activeArea = activeArea === area ? null : area
  }

  function inspectWithKeyboard(event: KeyboardEvent, area: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      inspect(area)
    }
  }
</script>

<svg
  viewBox="0 0 1000 680"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .wall {
        fill: none;
        stroke: #fffff0;
        stroke-width: 5;
      }
      .partition {
        fill: none;
        stroke: #777;
        stroke-width: 3;
      }
      .zone {
        fill: rgba(185, 135, 40, 0.08);
        stroke: #8d7335;
        stroke-width: 2;
        cursor: pointer;
        transition: fill 0.2s;
      }
      .zone:hover {
        fill: rgba(185, 135, 40, 0.22);
      }
      .zone-active {
        fill: rgba(185, 135, 40, 0.3);
        stroke: #ffd700;
        stroke-width: 2.5;
      }
      .label {
        fill: #fffff0;
        font: bold 15px sans-serif;
        text-anchor: middle;
        pointer-events: none;
      }
      .sub {
        fill: #c8a956;
        font: 11px sans-serif;
        text-anchor: middle;
        pointer-events: none;
      }
      .micro {
        fill: #9aa4ac;
        font: 9.5px sans-serif;
        text-anchor: middle;
        pointer-events: none;
      }
      .screen-cctv-green {
        fill: #142e22;
        stroke: #38825c;
        stroke-width: 1.5;
      }
      .screen-cctv-blue {
        fill: #14232e;
        stroke: #407b9e;
        stroke-width: 1.5;
      }
      .camera {
        fill: #b9c1c5;
        stroke: #222;
        stroke-width: 1.5;
      }
      .door-vault {
        fill: #3a3f44;
        stroke: #ffd700;
        stroke-width: 2;
      }
      .door-robot {
        fill: #42464b;
        stroke: #72a0c1;
        stroke-width: 2;
      }
      .door-wood {
        fill: #4a2a18;
        stroke: #b88e36;
        stroke-width: 2;
      }
      .door-white {
        fill: #eeeff2;
        stroke: #fff;
        stroke-width: 2.5;
      }
      .emblem-crest {
        fill: #161210;
        stroke: #cba048;
        stroke-width: 2.5;
      }
      .bunk {
        fill: #1e2226;
        stroke: #5a5e62;
        stroke-width: 2;
      }
    </style>
  </defs>

  <!-- Title header -->
  <text x="500" y="34" class="label" font-size="24" fill="#ffd700">
    {french ? 'Bureau de la famille Cha-R · Niveau 5' : 'Cha-R Family Office · Tier 5'}
  </text>
  <text x="500" y="56" class="sub">
    {french
      ? 'Section centrale près de l’hélice — Chapitres 379 & 380'
      : 'Middle section beside the propeller — Chapters 379 & 380'}
  </text>

  <g transform="translate(70 80)">
    <!-- Outer perimeter wall -->
    <rect width="860" height="540" class="wall" rx="4" />

    <!-- 1. SALLE PRINCIPALE À L'EMBLÈME -->
    <rect
      role="button"
      tabindex="0"
      aria-label={french ? 'Inspecter la salle principale à l’emblème' : 'Inspect the emblem room'}
      class="zone {activeArea === 'office' ? 'zone-active' : ''}"
      x="25"
      y="25"
      width="360"
      height="305"
      onclick={() => inspect('office')}
      onkeydown={(event) => inspectWithKeyboard(event, 'office')}
    />
    <text x="205" y="55" class="label">
      {french ? 'Salle principale à l’emblème' : 'Main Emblem Office'}
    </text>

    <!-- Écusson mural Cha-R -->
    <g transform="translate(145 68)">
      <rect x="0" y="0" width="120" height="32" class="emblem-crest" rx="2" />
      <polygon points="60,6 74,16 60,26 46,16" fill="#cba048" />
      <text
        x="60"
        y="19"
        font-family="serif"
        font-weight="bold"
        font-size="11"
        fill="#161210"
        text-anchor="middle">茶</text
      >
      <text x="60" y="42" class="micro" fill="#cba048">
        {french ? 'Écusson mural Cha-R' : 'Cha-R Crest'}
      </text>
    </g>

    <!-- Parquet en acajou avec bordure laiton -->
    <rect
      x="75"
      y="115"
      width="260"
      height="150"
      fill="#351d13"
      stroke="#cca64e"
      stroke-width="1.5"
      stroke-dasharray="6 4"
      rx="2"
    />

    <!-- Bureau de commandement -->
    <rect
      x="105"
      y="150"
      width="200"
      height="65"
      fill="#3d2014"
      stroke="#8d7335"
      stroke-width="2.5"
      rx="3"
    />
    <rect x="150" y="160" width="110" height="42" fill="#2c2e30" rx="2" />
    <!-- Fauteuil exécutif et chaises visiteurs -->
    <circle cx="205" cy="235" r="14" fill="#1f2123" stroke="#8d7335" stroke-width="1.5" />
    <circle cx="155" cy="132" r="10" fill="#2c2e30" stroke="#5a5e62" stroke-width="1.2" />
    <circle cx="255" cy="132" r="10" fill="#2c2e30" stroke="#5a5e62" stroke-width="1.2" />
    <text x="205" y="185" class="sub">
      {french ? 'Bureau de commandement' : 'Command Desk'}
    </text>

    <!-- Mini-dôme caméra d'angle -->
    <circle cx="370" cy="40" r="5" fill="#333" stroke="#cc2222" stroke-width="1.5" />
    <circle cx="370" cy="40" r="2" fill="#cc2222" />

    <!-- Les 3 portes spécifiques sur le mur ouest -->
    <!-- 1. Porte coffre-fort -->
    <g transform="translate(18 50)">
      <rect x="0" y="0" width="14" height="60" class="door-vault" rx="2" />
      <circle cx="7" cy="30" r="5" fill="#cba048" stroke="#1f2123" stroke-width="1.5" />
      <text x="26" y="26" class="micro" text-anchor="start" fill="#ffd700">
        {french ? '1. Porte coffre-fort' : '1. Vault Door'}
      </text>
      <text x="26" y="38" class="micro" text-anchor="start" fill="#888">
        {french ? '(blindée & volant)' : '(safe wheel)'}
      </text>
    </g>

    <!-- 2. Porte tête de robot -->
    <g transform="translate(18 140)">
      <rect x="0" y="0" width="14" height="60" class="door-robot" rx="2" />
      <!-- Fentes yeux robot -->
      <rect x="3" y="16" width="8" height="4" fill="#0d0e0f" />
      <rect x="3" y="24" width="8" height="4" fill="#0d0e0f" />
      <!-- Fentes pieds/bouche -->
      <rect x="4" y="38" width="6" height="8" fill="#0d0e0f" />
      <text x="26" y="26" class="micro" text-anchor="start" fill="#72a0c1">
        {french ? '2. Porte à tête de robot' : '2. Robot Face Door'}
      </text>
      <text x="26" y="38" class="micro" text-anchor="start" fill="#888">
        {french ? '(passage secret)' : '(secret passage)'}
      </text>
    </g>

    <!-- 3. Porte en bois -->
    <g transform="translate(18 230)">
      <rect x="0" y="0" width="14" height="60" class="door-wood" rx="2" />
      <circle cx="7" cy="30" r="2.5" fill="#b88e36" />
      <text x="26" y="26" class="micro" text-anchor="start" fill="#b88e36">
        {french ? '3. Porte en bois' : '3. Wooden Door'}
      </text>
      <text x="26" y="38" class="micro" text-anchor="start" fill="#888">
        {french ? '(moulures & laiton)' : '(paneled timber)'}
      </text>
    </g>

    <!-- 2. COMPARTIMENT DES COUCHETTES -->
    <rect
      role="button"
      tabindex="0"
      aria-label={french ? 'Inspecter la chambre des couchettes' : 'Inspect the bunk room'}
      class="zone {activeArea === 'bedroom' ? 'zone-active' : ''}"
      x="25"
      y="350"
      width="360"
      height="165"
      onclick={() => inspect('bedroom')}
      onkeydown={(event) => inspectWithKeyboard(event, 'bedroom')}
    />
    <text x="205" y="375" class="label">
      {french ? 'Compartiment des couchettes' : 'Bunk Compartment'}
    </text>
    <text x="205" y="392" class="micro" fill="#ffd700">
      {french
        ? 'Interrogatoire mené par Feitan & Phinks (Chap. 379)'
        : 'Feitan & Phinks interrogation scene (Ch. 379)'}
    </text>

    <!-- Lit superposé 1 (Interrogatoire Feitan/Phinks) -->
    <g transform="translate(45 405)">
      <rect x="0" y="0" width="90" height="90" class="bunk" rx="3" />
      <!-- Matelas et barreaux d'échelle -->
      <rect
        x="8"
        y="10"
        width="74"
        height="70"
        fill="#3e4736"
        stroke="#252729"
        stroke-width="1.5"
        rx="2"
      />
      <rect x="12" y="14" width="66" height="20" fill="#d6d8dc" rx="2" />
      <line x1="8" y1="35" x2="82" y2="35" stroke="#5a5e62" stroke-width="1.5" />
      <line x1="8" y1="55" x2="82" y2="55" stroke="#5a5e62" stroke-width="1.5" />
      <text x="45" y="75" class="micro">
        {french ? 'Lit superposé 1' : 'Bunk Bed 1'}
      </text>
    </g>

    <!-- Lit superposé 2 -->
    <g transform="translate(155 405)">
      <rect x="0" y="0" width="90" height="90" class="bunk" rx="3" />
      <rect
        x="8"
        y="10"
        width="74"
        height="70"
        fill="#292b2d"
        stroke="#252729"
        stroke-width="1.5"
        rx="2"
      />
      <rect x="12" y="14" width="66" height="20" fill="#d6d8dc" rx="2" />
      <line x1="8" y1="35" x2="82" y2="35" stroke="#5a5e62" stroke-width="1.5" />
      <line x1="8" y1="55" x2="82" y2="55" stroke="#5a5e62" stroke-width="1.5" />
      <text x="45" y="75" class="micro">
        {french ? 'Lit superposé 2' : 'Bunk Bed 2'}
      </text>
    </g>

    <!-- Étagères et armoires de stockage -->
    <g transform="translate(265 405)">
      <rect
        x="0"
        y="0"
        width="105"
        height="90"
        fill="#2e1a12"
        stroke="#523e1e"
        stroke-width="2"
        rx="2"
      />
      <line x1="10" y1="30" x2="95" y2="30" stroke="#7a6345" stroke-width="1.5" />
      <line x1="10" y1="60" x2="95" y2="60" stroke="#7a6345" stroke-width="1.5" />
      <rect x="15" y="8" width="22" height="18" fill="#7a6345" />
      <rect x="42" y="8" width="22" height="18" fill="#54402b" />
      <rect x="15" y="38" width="28" height="18" fill="#54402b" />
      <rect x="50" y="38" width="28" height="18" fill="#7a6345" />
      <text x="52" y="80" class="micro">
        {french ? 'Archives & stocks' : 'Shelves & Archives'}
      </text>
    </g>

    <!-- Casiers métalliques -->
    <g transform="translate(145 352)">
      <rect
        x="0"
        y="0"
        width="100"
        height="20"
        fill="#303439"
        stroke="#1f2123"
        stroke-width="1.5"
        rx="1"
      />
      <text x="50" y="14" class="micro" fill="#aaa">
        {french ? 'Casiers métalliques' : 'Steel Lockers'}
      </text>
    </g>

    <!-- Mini-dôme caméra d'angle -->
    <circle cx="370" cy="500" r="5" fill="#333" stroke="#cc2222" stroke-width="1.5" />
    <circle cx="370" cy="500" r="2" fill="#cc2222" />

    <!-- 3. SALLE DE VIDÉOSURVEILLANCE -->
    <rect
      role="button"
      tabindex="0"
      aria-label={french
        ? 'Inspecter la salle de vidéosurveillance'
        : 'Inspect the CCTV monitor room'}
      class="zone {activeArea === 'monitor-room' ? 'zone-active' : ''}"
      x="435"
      y="25"
      width="400"
      height="490"
      onclick={() => inspect('monitor-room')}
      onkeydown={(event) => inspectWithKeyboard(event, 'monitor-room')}
    />
    <text x="635" y="55" class="label">
      {french ? 'Salle de vidéosurveillance' : 'CCTV Monitor Room'}
    </text>
    <text x="635" y="72" class="sub">
      {french
        ? 'Surveillance des zones clés du niveau 5 (Chap. 380)'
        : 'Live CCTV coverage of key Tier 5 areas (Ch. 380)'}
    </text>

    <!-- Dalles de faux-plancher informatique -->
    <rect
      x="445"
      y="85"
      width="380"
      height="420"
      fill="none"
      stroke="#23272a"
      stroke-width="1"
      stroke-dasharray="14 14"
    />

    <!-- Mini-dômes caméras d'angle -->
    <circle cx="820" cy="40" r="5" fill="#333" stroke="#cc2222" stroke-width="1.5" />
    <circle cx="820" cy="40" r="2" fill="#cc2222" />
    <circle cx="820" cy="500" r="5" fill="#333" stroke="#cc2222" stroke-width="1.5" />
    <circle cx="820" cy="500" r="2" fill="#cc2222" />

    <!-- Porte blanche d'accès -->
    <g transform="translate(425 210)">
      <rect x="0" y="0" width="16" height="70" class="door-white" rx="2" />
      <circle cx="8" cy="35" r="3" fill="#d8dde2" />
      <text x="24" y="32" class="micro" text-anchor="start" fill="#fff" font-weight="bold">
        {french ? 'Porte blanche' : 'White Door'}
      </text>
      <text x="24" y="44" class="micro" text-anchor="start" fill="#bbb">
        {french ? '(accès sécurisé)' : '(secure access)'}
      </text>
    </g>

    <!-- Mur de 12 écrans CCTV en baie 4x3 -->
    <rect
      x="480"
      y="95"
      width="310"
      height="190"
      fill="#181a1c"
      stroke="#333"
      stroke-width="2"
      rx="4"
    />
    {#each Array(12) as _, i (i)}
      <g>
        <rect
          class={(Math.floor(i / 4) + (i % 4)) % 2 === 0 ? 'screen-cctv-green' : 'screen-cctv-blue'}
          x={495 + (i % 4) * 72}
          y={110 + Math.floor(i / 4) * 55}
          width="64"
          height="42"
          rx="2"
        />
        <circle
          cx={495 + (i % 4) * 72 + 56}
          cy={110 + Math.floor(i / 4) * 55 + 8}
          r="2.5"
          fill="#cc2222"
        />
      </g>
    {/each}
    <text x="635" y="275" class="micro" fill="#38825c">
      {french
        ? 'Baie de 12 moniteurs CCTV actifs (Entrepôt, Coursives, Entrées)'
        : 'Bank of 12 live CCTV feeds (Warehouse, Hallways, Gates)'}
    </text>

    <!-- Table de veille & Poste opérateur -->
    <g transform="translate(500 340)">
      <rect
        x="0"
        y="0"
        width="270"
        height="75"
        fill="#2c2e30"
        stroke="#5a5e62"
        stroke-width="2"
        rx="3"
      />
      <!-- Deux moniteurs de bureau -->
      <rect x="35" y="10" width="45" height="26" class="screen-cctv-blue" rx="1.5" />
      <rect x="190" y="10" width="45" height="26" class="screen-cctv-green" rx="1.5" />
      <!-- Clavier et console centrale -->
      <rect x="95" y="15" width="80" height="20" fill="#1f2123" rx="1.5" />
      <!-- Siège opérateur -->
      <circle cx="135" cy="55" r="14" fill="#181a1c" stroke="#d8dde2" stroke-width="1.5" />
      <text x="135" y="95" class="sub">
        {french ? 'Poste de veille opérateur' : 'Operator Control Desk'}
      </text>
    </g>

    <!-- 4. COULOIR ET ENTRÉE DU BUREAU -->
    <line x1="400" y1="25" x2="400" y2="515" class="partition" stroke-dasharray="8 6" />
    <line x1="25" y1="340" x2="385" y2="340" class="partition" />

    <!-- Porte d'entrée blindée à digicode -->
    <g transform="translate(360 520)">
      <line x1="0" y1="10" x2="80" y2="10" stroke="#39424a" stroke-width="16" />
      <circle cx="85" cy="10" r="4" fill="#22cc44" />
      <text x="40" y="-12" class="sub">
        {french ? 'Porte blindée à serrure électronique' : 'Steel smart-lock entrance door'}
      </text>
      <!-- Deux caméras d'entrée -->
      <path class="camera" d="M-20 -15 h30 l10 10 h-40 z" />
      <path class="camera" d="M70 -15 h30 l10 10 h-40 z" />
      <text x="40" y="3" class="micro">
        {french ? 'Deux caméras de surveillance' : 'Dual surveillance cameras'}
      </text>
    </g>
  </g>
</svg>
