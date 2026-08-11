<script lang="ts">
  import { fade, scale } from 'svelte/transition'
  import { toBlob } from 'html-to-image'

  interface Props {
    photoBlob: Blob
    onClose: () => void
  }
  let { photoBlob, onClose }: Props = $props()

  let photoUrl = $derived(URL.createObjectURL(photoBlob))
  let saving = $state(false)
  let text = $state('Bons baisers du Tier 1')
  let stampType = $state<'kakin' | 'hunter'>('kakin')

  // Clean up URL object when component unmounts
  $effect(() => {
    return () => URL.revokeObjectURL(photoUrl)
  })

  async function handleDownload() {
    saving = true
    try {
      const node = document.getElementById('postcard-export-frame')
      if (node) {
        // Run html-to-image on the frame
        const dataBlob = await toBlob(node, { cacheBust: true, pixelRatio: 2 })
        if (dataBlob) {
          const url = URL.createObjectURL(dataBlob)
          const a = document.createElement('a')
          a.href = url
          a.download = `kakin-postcard.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          onClose()
        }
      }
    } finally {
      saving = false
    }
  }
</script>

<div
  class="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 lg:p-8"
  transition:fade={{ duration: 200 }}
>
  <div
    class="flex flex-col gap-6 w-full max-w-4xl"
    transition:scale={{ start: 0.95, duration: 200 }}
  >
    <!-- Postcard preview -->
    <div class="relative flex justify-center items-center w-full min-h-[40vh]">
      <!-- The element that will be exported -->
      <div
        id="postcard-export-frame"
        class="relative bg-[#fffdf0] p-4 pb-16 shadow-2xl overflow-hidden flex flex-col items-center"
        style="border: 2px solid #ddd; max-width: 100%; aspect-ratio: 4/3; width: 800px;"
      >
        <!-- The photo -->
        <img
          src={photoUrl}
          alt="Screenshot"
          class="w-full h-full object-cover border border-gray-300"
          style="min-height: 0;"
        />

        <!-- Overlay Text -->
        <div
          class="absolute bottom-4 left-0 w-full text-center px-4 font-serif italic text-3xl text-zinc-800 drop-shadow-sm tracking-wide"
        >
          {text}
        </div>

        <!-- Stamps -->
        {#if stampType === 'kakin'}
          <div
            class="absolute -top-6 -right-6 w-32 h-32 rounded-full border-[6px] border-red-700/80 text-red-700/80 flex items-center justify-center rotate-[15deg] mix-blend-multiply pointer-events-none opacity-90"
          >
            <div
              class="text-center font-bold uppercase tracking-tighter leading-tight"
              style="font-size: 1.1rem; border-top: 2px dashed rgba(185,28,28,0.8); border-bottom: 2px dashed rgba(185,28,28,0.8); padding: 4px 0;"
            >
              KAKIN EMPIRE<br />
              <span class="text-sm">Official VIP</span>
            </div>
          </div>
        {:else}
          <div
            class="absolute -top-4 -right-4 w-28 h-28 border-[4px] border-blue-800/80 text-blue-800/80 flex items-center justify-center rotate-[-10deg] mix-blend-multiply pointer-events-none opacity-90"
          >
            <div
              class="text-center font-bold uppercase tracking-widest leading-none"
              style="font-size: 1.5rem;"
            >
              HUNTER<br />
              <span class="text-sm border-t border-blue-800/80 mt-1 block pt-1">ASSOC.</span>
            </div>
          </div>
        {/if}

        <!-- Subtle vintage texture overlay -->
        <div
          class="absolute inset-0 pointer-events-none"
          style="background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.05) 100%);"
        ></div>
      </div>
    </div>

    <!-- Controls -->
    <div
      class="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col md:flex-row gap-6 shadow-xl w-full mx-auto justify-between items-center text-white"
    >
      <div class="flex-1 flex flex-col gap-4 w-full">
        <label class="flex flex-col gap-1 text-sm font-medium text-zinc-400">
          Message de la carte
          <input
            type="text"
            bind:value={text}
            class="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
            maxlength="40"
          />
        </label>

        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-zinc-400">Tampon :</span>
          <label class="flex items-center gap-2 cursor-pointer hover:text-red-400">
            <input type="radio" bind:group={stampType} value="kakin" class="accent-red-500" />
            Empire Kakin
          </label>
          <label class="flex items-center gap-2 cursor-pointer hover:text-blue-400">
            <input type="radio" bind:group={stampType} value="hunter" class="accent-blue-500" />
            Association Hunter
          </label>
        </div>
      </div>

      <div class="flex gap-4">
        <button
          class="px-5 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          onclick={onClose}
        >
          Annuler
        </button>
        <button
          class="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-colors flex items-center gap-2"
          onclick={handleDownload}
          disabled={saving}
        >
          {#if saving}
            <div
              class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
            ></div>
            Création...
          {:else}
            Télécharger
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>
