<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity'
  import { theShip } from '$lib/tour/blueprint'
  import { centroid } from '$lib/tour/hatsu'
  import TourScene from '$lib/components/tour/TourScene.svelte'
  import { t } from '$lib/i18n'
  import type { Apparition } from '$lib/tour/apparitions'
  import type { Vec2 } from '$lib/tour/types'

  const ship = theShip()

  // Game state
  let tierId = $state('t1')
  let currentSpace = $state(null)
  let position = $state<Vec2>([0, 0])
  let heading = $state(Math.PI)
  let jumpTo = $state<string | null>('1014')

  let notebookOpen = $state(false)
  let activeDialog = $state<{ name: string; text: string } | null>(null)
  const clues = new SvelteSet<string>()

  const npcs = [
    { id: 'kurapika', name: 'Kurapika', color: 0xffeeaa, posOffset: [2, 0] },
    { id: 'bill', name: 'Bill', color: 0xaaffaa, posOffset: [-2, 1] },
    { id: 'oito', name: 'Oito', color: 0xffaaff, posOffset: [0, -2] },
    { id: 'corps', name: 'Garde (Corps)', color: 0x880000, posOffset: [0, 2], isDead: true },
  ]

  // Setup positions around the center of room 1014
  let interactables = $derived.by(() => {
    const space = ship.spaces.get('1014')
    const center = space ? centroid(space) : [0, 0]

    return npcs.map((npc) => ({
      ...npc,
      position: [center[0] + npc.posOffset[0], center[1] + npc.posOffset[1]] as Vec2,
    }))
  })

  // Build extras (Apparitions) for TourScene
  let extras = $derived.by(() => {
    return interactables.map(
      (npc) =>
        ({
          id: npc.id,
          kind: 'avatar',
          colour: npc.color,
          size: npc.isDead ? 1.0 : 0.4,
          y: npc.isDead ? -0.9 : 0, // Corps on the floor
          at: npc.position,
          tierId: 't1',
          spaceId: '1014',
          stage: 0,
          hidden: false,
          pick: true, // Clickable!
        }) as Apparition,
    )
  })

  const DIALOGS: Record<string, { text: string; clue?: string }> = {
    kurapika: {
      text: "Le garde a été manipulé. Quelqu'un manipule l'aura dans cette pièce. Restez sur vos gardes.",
      clue: 'Aura de manipulation détectée.',
    },
    bill: {
      text: "Je n'ai rien vu... Tout s'est passé si vite. On devrait évacuer le Prince.",
      clue: 'Aucun témoin visuel direct.',
    },
    oito: {
      text: '(Tremble) Mon bébé... Protégez Woble, je vous en prie !',
    },
    corps: {
      text: "Le corps est criblé de trous minuscules, comme s'il avait été transpercé par de multiples aiguilles.",
      clue: 'Blessures par perforation (aiguilles ?)',
    },
  }

  function handlePick(id: string) {
    // Prevent picking if a dialog is already open
    if (activeDialog) return

    const npc = interactables.find((i) => i.id === id)
    const dialogData = DIALOGS[id]

    if (npc && dialogData) {
      activeDialog = {
        name: npc.name,
        text: dialogData.text,
      }
      if (dialogData.clue) {
        clues.add(dialogData.clue)
      }
    }
  }

  function closeDialog() {
    activeDialog = null
  }
</script>

<div class="relative h-screen w-full overflow-hidden bg-black font-sans">
  <TourScene
    {ship}
    bind:tierId
    bind:currentSpace
    bind:position
    bind:heading
    bind:jumpTo
    {extras}
    onPick={handlePick}
    touchLabels={{ move: $t.tour.touch.move, cast: $t.tour.touch.cast }}
    soundLabels={{ silence: $t.tour.sound.silence, restore: $t.tour.sound.restore }}
    loadingLabel={$t.tour.loading}
    unsupportedLabel={$t.tour.unsupported}
  />

  <!-- Overlay to block TourScene interaction when Dialog is open -->
  {#if activeDialog}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="absolute inset-0 z-40 bg-black/20" onclick={closeDialog}></div>
  {/if}

  <!-- Dialogue Box -->
  {#if activeDialog}
    <div
      class="absolute bottom-8 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl z-50 bg-slate-900/95 border-2 border-slate-700 rounded-lg p-6 shadow-2xl backdrop-blur-sm flex flex-col pointer-events-auto"
    >
      <h3 class="text-blue-400 font-bold text-xl mb-2 tracking-wide">{activeDialog.name}</h3>
      <p class="text-white text-lg leading-relaxed">{activeDialog.text}</p>
      <div class="mt-4 flex justify-end">
        <button
          onclick={closeDialog}
          class="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded transition-colors text-sm uppercase tracking-wider"
        >
          Continuer
        </button>
      </div>
    </div>
  {/if}

  <!-- HUD: Notebook Toggle -->
  <div class="absolute top-6 right-6 z-30 pointer-events-auto">
    <button
      class="px-4 py-3 bg-amber-900/90 hover:bg-amber-800 border-2 border-amber-700 text-amber-100 font-bold rounded-l-lg shadow-lg flex items-center gap-2 transition-transform"
      onclick={() => (notebookOpen = !notebookOpen)}
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        ></path></svg
      >
      Carnet ({clues.size})
    </button>
  </div>

  <!-- Notebook Panel -->
  {#if notebookOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="absolute inset-0 z-40" onclick={() => (notebookOpen = false)}></div>

    <div
      class="absolute top-20 right-6 w-80 bg-[#f4e4bc] border-l-4 border-amber-800 p-6 shadow-2xl z-50 rounded-b-lg transform origin-top-right transition-transform pointer-events-auto min-h-64"
    >
      <h2 class="text-2xl font-serif text-amber-950 border-b-2 border-amber-900/30 pb-2 mb-4">
        Indices Récoltés
      </h2>

      {#if clues.size === 0}
        <p class="text-amber-900/60 italic text-center mt-8 font-serif">
          Le carnet est vide pour l'instant. Interrogez les témoins.
        </p>
      {:else}
        <ul class="space-y-3">
          {#each Array.from(clues) as clue (clue)}
            <li class="text-amber-950 font-serif leading-snug flex items-start">
              <span class="mr-2 text-amber-800">•</span>
              {clue}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}

  <!-- Crosshair (since you need to aim to pick) -->
  <div class="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
    <div class="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
  </div>
</div>
