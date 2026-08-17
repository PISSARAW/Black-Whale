<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { hatsuAudioGraph } from '$lib/audio/ambient.js'

  // Room interactions are not wired up yet. The elements keep their click
  // and keyboard affordances so the behaviour can be attached in one place
  // when it exists; until then this must not log on a public page.
  function handleElementClick(_elementId: string) {}

  let osc: OscillatorNode | null = null
  let lfo: OscillatorNode | null = null
  let gain: GainNode | null = null

  onMount(() => {
    const graph = hatsuAudioGraph()
    if (!graph) return
    const { context } = graph

    // Low ominous hum (bourdonnement) - roughly G1 (49 Hz)
    osc = context.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = 49

    // LFO for the pulsating "OOOOO" effect
    lfo = context.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 3 // 3 pulses per second

    const lfoGain = context.createGain()
    lfoGain.gain.value = 4 // subtle frequency modulation
    lfo.connect(lfoGain)
    lfoGain.connect(osc.frequency)

    gain = context.createGain()
    gain.gain.setValueAtTime(0.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.02, context.currentTime + 2) // Fade in smoothly

    osc.connect(gain)
    gain.connect(graph.muffle)

    osc.start()
    lfo.start()
  })

  onDestroy(() => {
    if (gain) {
      const graph = hatsuAudioGraph()
      const now = graph?.context.currentTime || 0
      // Fade out to prevent clicks
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
  })
</script>

<svg
  viewBox="0 0 800 800"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .wall {
        stroke: #fffff0;
        stroke-width: 6;
        fill: none;
      }
      .zone {
        fill: rgba(255, 215, 0, 0.05);
        transition: fill 0.2s;
        cursor: pointer;
      }
      .zone:hover {
        fill: rgba(255, 215, 0, 0.15);
      }
      .label {
        fill: #fffff0;
        font-family: sans-serif;
        font-size: 16px;
        font-weight: bold;
        pointer-events: none;
        text-anchor: middle;
      }
      .sublabel {
        fill: #ffd700;
        font-size: 12px;
        pointer-events: none;
        text-anchor: middle;
      }
      .casket {
        fill: #111;
        stroke: #ffd700;
        stroke-width: 2;
      }
      .casket-occupied {
        fill: #311;
        stroke: #f00;
        stroke-width: 3;
      }
      .light {
        fill: #444;
      }
      .light-on {
        fill: #f00;
        filter: drop-shadow(0 0 5px #f00);
      }
      .capsule {
        fill: #222;
        stroke: #888;
        stroke-width: 4;
      }
      .pot {
        fill: #422;
        stroke: #864;
        stroke-width: 2;
      }
      .rune {
        stroke: #ffd700;
        stroke-width: 1;
        fill: none;
        opacity: 0.3;
      }
    </style>
  </defs>

  <text x="400" y="40" class="label" font-size="28" fill="#FFD700">Princes' Burial Chamber</text>

  <g transform="translate(100, 100)">
    <!-- Circular Room outline -->
    <circle cx="300" cy="300" r="280" class="wall" />
    <circle cx="300" cy="300" r="270" fill="none" stroke="#333" stroke-width="2" />

    <!-- Giant Greed Island style runes on floor -->
    <circle cx="300" cy="300" r="200" class="rune" />
    <circle cx="300" cy="300" r="100" class="rune" />
    <path d="M 300 100 L 473 200 L 473 400 L 300 500 L 127 400 L 127 200 Z" class="rune" />
    <path d="M 300 200 L 386 250 L 386 350 L 300 400 L 214 350 L 214 250 Z" class="rune" />

    <!-- Central Capsule -->
    <circle
      role="button"
      tabindex="0"
      aria-label="Inspect map area"
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }
      }}
      class="zone"
      cx="300"
      cy="300"
      r="50"
      onclick={() => handleElementClick('central-capsule')}
    />
    <circle cx="300" cy="300" r="40" class="capsule" />
    <circle cx="300" cy="300" r="30" fill="#111" />
    <circle cx="300" cy="300" r="10" fill="#FFD700" opacity="0.5" />

    <!-- 2 Pots near capsule -->
    <circle cx="230" cy="300" r="15" class="pot" />
    <circle cx="370" cy="300" r="15" class="pot" />

    <!-- 14 Caskets around the perimeter -->
    {#each Array(14) as _, i (i)}
      <g transform="translate(300, 300) rotate({i * (360 / 14)}) translate(0, -220)">
        <rect
          role="button"
          tabindex="0"
          aria-label="Inspect map area"
          onkeydown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
            }
          }}
          x="-15"
          y="-30"
          width="30"
          height="60"
          class="casket"
          onclick={() => handleElementClick(`casket-${i}`)}
          cursor="pointer"
        />
        <!-- Indicator Light between casket and center -->
        <circle cx="0" cy="45" r="5" class="light" />
      </g>
    {/each}
  </g>
</svg>
