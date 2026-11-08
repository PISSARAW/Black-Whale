<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { locale } from '$lib/i18n'
  import { hatsuAudioGraph } from '$lib/audio/ambient.js'
  import {
    burialRooms,
    burialCoffins,
    burialReliquary,
    burialCables,
    burialPolygon,
  } from '$lib/components/map/projection/burialChamberPlan'

  const french = $derived($locale === 'fr')

  let osc: OscillatorNode | null = null
  let lfo: OscillatorNode | null = null
  let gain: GainNode | null = null

  function initOminousAudio(): void {
    const graph = hatsuAudioGraph()
    if (!graph) return
    const { context } = graph

    // Low ominous hum (bourdonnement rituel) - G1 (49 Hz)
    osc = context.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = 49

    // LFO for the pulsating "OOOOO" effect from chapter 371
    lfo = context.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 3

    const lfoGain = context.createGain()
    lfoGain.gain.value = 4
    lfo.connect(lfoGain)
    lfoGain.connect(osc.frequency)

    gain = context.createGain()
    gain.gain.setValueAtTime(0.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.02, context.currentTime + 2)

    osc.connect(gain)
    gain.connect(graph.muffle)

    osc.start()
    lfo.start()
  }

  function teardownAudio(): void {
    if (!gain) return
    const graph = hatsuAudioGraph()
    const now = graph?.context.currentTime || 0
    gain.gain.cancelScheduledValues(now)
    gain.gain.setTargetAtTime(0.0001, now, 0.2)
    setTimeout(() => {
      if (osc) {
        try {
          osc.stop()
        } catch {
          /* ignore */
        }
        osc.disconnect()
      }
      if (lfo) {
        try {
          lfo.stop()
        } catch {
          /* ignore */
        }
        lfo.disconnect()
      }
      gain?.disconnect()
    }, 500)
  }

  onMount(() => {
    initOminousAudio()
  })

  onDestroy(() => {
    teardownAudio()
  })
</script>

<svg
  viewBox="0 0 800 800"
  role="img"
  aria-label={french
    ? 'Plan de la chambre funéraire des princes, les 14 cercueils autour de la machine centrale'
    : 'Princes’ burial chamber plan, 14 caskets arranged around the central apparatus'}
  class="w-full h-full rounded-lg border border-[#333] bg-[#050505] text-[#fffff0]"
>
  <defs>
    <!-- Ritual Nen Circuit Pattern -->
    <pattern id="ritual-circuit" width="80" height="80" patternUnits="userSpaceOnUse">
      <path
        d="M 10 0 L 10 30 L 40 30 L 40 70 L 70 70 L 70 80 M 0 50 L 25 50 L 25 80 M 50 0 L 50 20 L 80 20"
        fill="none"
        stroke="#4a4235"
        stroke-width="1"
        stroke-opacity="0.4"
      />
    </pattern>
    <!-- Glowing Nen soul filter -->
    <filter id="momoze-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Titles -->
  <text x="400" y="32" text-anchor="middle" fill="#ffd700" font-size="22" font-weight="bold">
    {french ? 'Chambre funéraire des princes' : 'Princes’ Burial Chamber'}
  </text>
  <text x="400" y="52" text-anchor="middle" fill="#b1a58d" font-size="12">
    {french
      ? 'Chap. 420 · Cercueils fermés : n°8, n°10, n°12 · Autres cercueils ouverts'
      : 'Ch. 420 · Sealed caskets: #8, #10, #12 · Other caskets open'}
  </text>

  <!-- Room footprint & floor -->
  {#each burialRooms as room (room.id)}
    <polygon
      points={burialPolygon(room.footprint)}
      fill="url(#ritual-circuit)"
      stroke="#c8c1ae"
      stroke-width="2.5"
    />
  {/each}

  <!-- Concentric Ritual Maze Circles -->
  <g stroke="#6e624c" stroke-width="1.2" fill="none" opacity="0.6">
    <circle cx="400" cy="400" r="85" stroke-dasharray="12 6" />
    <circle cx="400" cy="400" r="140" stroke-dasharray="24 8 8 8" />
    <circle cx="400" cy="400" r="195" stroke-dasharray="16 6" />
    <circle cx="400" cy="400" r="250" stroke-dasharray="32 10 12 10" />
    <circle cx="400" cy="400" r="310" stroke-dasharray="8 6" />
  </g>

  <!-- Radial connecting cables from center to caskets -->
  {#each burialCables as cable (cable.index)}
    <line
      x1={cable.from.x}
      y1={cable.from.y}
      x2={cable.to.x}
      y2={cable.to.y}
      stroke={cable.flame ? '#d97706' : '#3d3830'}
      stroke-width={cable.active ? 2.5 : 1.5}
    />
    <!-- Intermediate Soul Node / Relay -->
    {#if cable.flame}
      <circle
        cx={cable.node.x}
        cy={cable.node.y}
        r="8"
        fill="#f59e0b"
        stroke="#fef3c7"
        stroke-width="2"
        filter="url(#momoze-glow)"
      >
        <title
          >{french
            ? `Relais actif : âme de ${cable.prince?.nameFr}`
            : `Active relay: ${cable.prince?.name}’s life force`}</title
        >
      </circle>
      <circle cx={cable.node.x} cy={cable.node.y} r="3" fill="#ffffff" />
    {:else}
      <circle
        cx={cable.node.x}
        cy={cable.node.y}
        r="5"
        fill="#1e1b18"
        stroke="#6b5e4a"
        stroke-width="1.2"
      >
        <title
          >{french
            ? `Relais n°${cable.coffinNumber} (en attente : ${cable.prince?.nameFr})`
            : `Relay #${cable.coffinNumber} (awaiting: ${cable.prince?.name})`}</title
        >
      </circle>
    {/if}
  {/each}

  <!-- Central Machine Starburst Sharp Spikes (28 razor teeth from ch. 371) -->
  <g>
    {#each Array(14) as _, i (i)}
      {@const longAngle = (i * 2 * Math.PI) / 14}
      {@const lx1 = 400 + Math.cos(longAngle - 0.07) * 40}
      {@const ly1 = 400 + Math.sin(longAngle - 0.07) * 40}
      {@const lx2 = 400 + Math.cos(longAngle) * 85}
      {@const ly2 = 400 + Math.sin(longAngle) * 85}
      {@const lx3 = 400 + Math.cos(longAngle + 0.07) * 40}
      {@const ly3 = 400 + Math.sin(longAngle + 0.07) * 40}
      <polygon
        points="{lx1},{ly1} {lx2},{ly2} {lx3},{ly3}"
        fill="#26211a"
        stroke="#d4af37"
        stroke-width="1"
      />

      {@const shortAngle = longAngle + Math.PI / 14}
      {@const sx1 = 400 + Math.cos(shortAngle - 0.06) * 40}
      {@const sy1 = 400 + Math.sin(shortAngle - 0.06) * 40}
      {@const sx2 = 400 + Math.cos(shortAngle) * 62}
      {@const sy2 = 400 + Math.sin(shortAngle) * 62}
      {@const sx3 = 400 + Math.cos(shortAngle + 0.06) * 40}
      {@const sy3 = 400 + Math.sin(shortAngle + 0.06) * 40}
      <polygon
        points="{sx1},{sy1} {sx2},{sy2} {sx3},{sy3}"
        fill="#1a1816"
        stroke="#8c7d67"
        stroke-width="0.8"
      />
    {/each}
  </g>

  <!-- Central Reliquary Apparatus & 14 Cable Ports -->
  {#if burialReliquary}
    <circle cx="400" cy="400" r="44" fill="#1c1917" stroke="#d4af37" stroke-width="2.5">
      <title>{french ? burialReliquary.nameFr : burialReliquary.name}</title>
    </circle>
    <circle cx="400" cy="400" r="30" fill="#292524" stroke="#a88b4d" stroke-width="1.5" />
    <!-- 14 cable ports / nozzles -->
    {#each burialCables as cable (cable.index)}
      {@const angle = Math.atan2(cable.to.y - 400, cable.to.x - 400)}
      <circle
        cx={400 + Math.cos(angle) * 43}
        cy={400 + Math.sin(angle) * 43}
        r={cable.active ? 3.5 : 2.5}
        fill={cable.flame ? '#f59e0b' : '#3d3830'}
        stroke={cable.flame ? '#fef3c7' : '#8c7d67'}
        stroke-width="1"
      />
    {/each}
    <circle cx="400" cy="400" r="14" fill="#44403c" stroke="#ffd700" stroke-width="1.5" />
    <text x="400" y="404" text-anchor="middle" fill="#d4af37" font-size="11" font-weight="bold">
      壺
    </text>
  {/if}

  <!-- The 14 Coffins -->
  {#each burialCoffins as coffin (coffin.id)}
    {@const rad = (coffin.rotation * Math.PI) / 180}
    <!-- Coffin outer tub -->
    <polygon
      points={coffin.polygon}
      fill={coffin.closed ? '#38221f' : '#141210'}
      stroke={coffin.closed ? '#d4af37' : '#6b5e4a'}
      stroke-width={coffin.closed ? 2.5 : 1.2}
      stroke-dasharray={coffin.closed ? undefined : '4 2'}
    >
      <title>
        {coffin.closed
          ? french
            ? `Cercueil n°${coffin.coffinNumber} (scellé) · ${coffin.prince?.nameFr} · chap. ${coffin.prince?.chapter}`
            : `Casket #${coffin.coffinNumber} (sealed) · ${coffin.prince?.name} · ch. ${coffin.prince?.chapter}`
          : french
            ? `Cercueil n°${coffin.coffinNumber} (ouvert · en attente) · ${coffin.prince?.nameFr}`
            : `Casket #${coffin.coffinNumber} (open · awaiting) · ${coffin.prince?.name}`}
      </title>
    </polygon>

    <!-- Axial spine ridge along vault -->
    <line
      x1={coffin.point.x - Math.sin(rad) * 26}
      y1={coffin.point.y - Math.cos(rad) * 26}
      x2={coffin.point.x + Math.sin(rad) * 26}
      y2={coffin.point.y + Math.cos(rad) * 26}
      stroke={coffin.closed ? '#d4af37' : '#3f382f'}
      stroke-width={coffin.closed ? 2 : 1}
    />

    <!-- Coffin core: Viewing window with flame for deceased -->
    {#if coffin.closed}
      <circle
        cx={coffin.point.x}
        cy={coffin.point.y}
        r="7"
        fill="#f59e0b"
        fill-opacity="0.6"
        stroke="#fde68a"
        stroke-width="1.5"
        filter="url(#momoze-glow)"
      />
    {/if}
  {/each}

  <!-- Key annotations -->
  <text x="400" y="475" text-anchor="middle" fill="#d4af37" font-size="11">
    {french ? 'Appareil rituel central' : 'Central ritual apparatus'}
  </text>
  <text x="400" y="780" text-anchor="middle" fill="#8c7d67" font-size="11">
    {french
      ? 'Quatorze capsules par numéro de prince · Chap. 420 : n°8, n°10 et n°12 fermés (non adjacents)'
      : 'Fourteen caskets by prince number · Ch. 420: #8, #10 & #12 closed (non-adjacent)'}
  </text>
</svg>
