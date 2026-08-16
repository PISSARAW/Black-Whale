<script lang="ts">
  import { fade, scale } from 'svelte/transition'
  import { t } from '$lib/i18n'
  import { createPostcardBlob } from '$lib/tour/postcardExport'
  import {
    POSTCARD_STAMPS,
    POSTCARD_STAMP_BACKING,
    postcardStamp,
    type PostcardStampCategory,
    type PostcardStampId,
  } from '$lib/tour/postcardStamps'

  interface Props {
    photoBlob: Blob
    onClose: () => void
  }
  let { photoBlob, onClose }: Props = $props()

  let photoUrl = $state<string | null>(null)
  let imageReady = $state(false)
  let saving = $state(false)
  let downloadFailed = $state(false)
  let frameNode = $state<HTMLElement>()
  let photoNode = $state<HTMLImageElement>()
  let overlayNode = $state<HTMLElement>()
  let text = $state($t.tour.postcard.defaultMessage)
  let stampType = $state<PostcardStampId>('kakin')
  let activeStamp = $derived(postcardStamp(stampType))
  let activeStampCopy = $derived($t.tour.postcard.stamps[stampType])

  const stampCategories: PostcardStampCategory[] = ['official', 'royal', 'underworld', 'expedition']

  // Keep the preview self-contained and decodable after the temporary capture
  // blob has left the tour renderer. The export draws this loaded image
  // directly into its canvas rather than fetching it again.
  $effect(() => {
    const reader = new FileReader()
    reader.onload = () => {
      photoUrl = typeof reader.result === 'string' ? reader.result : null
    }
    reader.onerror = () => {
      downloadFailed = true
    }
    reader.readAsDataURL(photoBlob)

    return () => {
      if (reader.readyState === FileReader.LOADING) reader.abort()
    }
  })

  // The route entrance animation leaves a transform on its shell. Fixed
  // descendants would otherwise be positioned against the whole route rather
  // than the viewport, putting this modal below the fold on a long tour page.
  $effect(() => {
    document.documentElement.classList.add('postcard-open')
    return () => document.documentElement.classList.remove('postcard-open')
  })

  async function handleDownload() {
    saving = true
    downloadFailed = false
    try {
      if (frameNode && photoNode && overlayNode) {
        const dataBlob = await createPostcardBlob({
          frame: frameNode,
          photo: photoNode,
          overlay: overlayNode,
          pixelRatio: 2,
        })
        if (dataBlob) {
          const url = URL.createObjectURL(dataBlob)
          const a = document.createElement('a')
          a.href = url
          a.download = `kakin-postcard.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          // Let the browser consume the object URL before releasing it.
          window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
          onClose()
        } else {
          downloadFailed = true
        }
      } else downloadFailed = true
    } catch (error) {
      console.error('Unable to create postcard.', error)
      downloadFailed = true
    } finally {
      saving = false
    }
  }
</script>

<div
  class="postcard-modal fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-sm p-4 lg:items-center lg:p-8"
  transition:fade={{ duration: 200 }}
>
  <div
    class="my-auto flex w-full max-w-4xl flex-col gap-6"
    transition:scale={{ start: 0.95, duration: 200 }}
  >
    <!-- Postcard preview -->
    <div class="relative flex justify-center items-center w-full min-h-[40vh]">
      <!-- The element that will be exported -->
      <div
        id="postcard-export-frame"
        bind:this={frameNode}
        class="relative bg-[#fffdf0] p-4 pb-16 shadow-2xl overflow-hidden flex flex-col items-center"
        style="border: 2px solid #ddd; max-width: 100%; aspect-ratio: 4/3; width: 800px;"
      >
        <!-- The photo -->
        {#if photoUrl}
          <img
            bind:this={photoNode}
            src={photoUrl}
            alt={$t.tour.postcard.imageAlt}
            class="w-full h-full object-cover border border-gray-300"
            style="min-height: 0;"
            onload={() => (imageReady = true)}
          />
        {/if}

        <div bind:this={overlayNode} class="absolute inset-0 pointer-events-none">
          <!-- Overlay Text -->
          <div
            class="absolute bottom-4 left-0 w-full text-center px-4 font-serif italic text-3xl text-zinc-800 drop-shadow-sm tracking-wide"
          >
            {text}
          </div>

          <!-- The seals are fictional souvenirs: owner-driven, but never presented as canon logos. -->
          <div
            class={`postcard-stamp stamp-${activeStamp.id} shape-${activeStamp.shape} tone-${activeStamp.tone}`}
            style={`--stamp-color: ${activeStamp.ink}; --stamp-backing: ${POSTCARD_STAMP_BACKING}; --stamp-rotation: ${activeStamp.rotation}deg;`}
            aria-hidden="true"
          >
            <span class="stamp-orbit"></span>
            <span class="stamp-mark">{activeStamp.mark}</span>
            <span class="stamp-title">{activeStampCopy.title}</span>
            <span class="stamp-motto">{activeStampCopy.motto}</span>
            <span class="stamp-serial"
              >BW1 · {String(POSTCARD_STAMPS.indexOf(activeStamp) + 1).padStart(2, '0')}</span
            >
          </div>

          <!-- Subtle vintage texture overlay -->
          <div
            class="absolute inset-0"
            style="background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.05) 100%);"
          ></div>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div
      class="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col md:flex-row gap-6 shadow-xl w-full mx-auto justify-between items-center text-white"
    >
      <div class="flex-1 flex flex-col gap-4 w-full">
        <label class="flex flex-col gap-1 text-sm font-medium text-zinc-400">
          {$t.tour.postcard.message}
          <input
            type="text"
            bind:value={text}
            class="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
            maxlength="40"
          />
        </label>

        <label class="flex flex-col gap-1 text-sm font-medium text-zinc-400">
          {$t.tour.postcard.stamp}
          <select
            bind:value={stampType}
            class="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
          >
            {#each stampCategories as category (category)}
              <optgroup label={$t.tour.postcard.stampCategories[category]}>
                {#each POSTCARD_STAMPS.filter((stamp) => stamp.category === category) as stamp (stamp.id)}
                  <option value={stamp.id}>{$t.tour.postcard.stamps[stamp.id].name}</option>
                {/each}
              </optgroup>
            {/each}
          </select>
          <span class="text-xs font-normal text-zinc-500">{$t.tour.postcard.stampHint}</span>
        </label>
      </div>

      <div class="flex gap-4">
        <button
          class="px-5 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          onclick={onClose}
        >
          {$t.tour.postcard.cancel}
        </button>
        <button
          type="button"
          class="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-colors flex items-center gap-2"
          onclick={handleDownload}
          disabled={saving || !imageReady}
        >
          {#if saving}
            <div
              class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
            ></div>
            {$t.tour.postcard.creating}
          {:else}
            {$t.tour.postcard.download}
          {/if}
        </button>
      </div>
    </div>
    {#if downloadFailed}
      <p
        class="rounded border border-red-500/50 bg-red-950/80 px-4 py-3 text-center text-sm text-red-100"
        role="alert"
      >
        {$t.tour.postcard.downloadError}
      </p>
    {/if}
  </div>
</div>

<style>
  .postcard-stamp {
    --stamp-color: #8f172b;
    --stamp-backing: #fffdf0;
    --stamp-rotation: 0deg;
    position: absolute;
    z-index: 4;
    top: 0.75rem;
    right: 0.8rem;
    width: 9rem;
    height: 9rem;
    display: grid;
    grid-template-rows: 1fr auto auto;
    place-items: center;
    padding: 0.7rem;
    overflow: hidden;
    color: var(--stamp-color);
    background: var(--stamp-backing);
    border: 0.28rem solid currentColor;
    transform: rotate(var(--stamp-rotation));
    opacity: 1;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    text-align: center;
    text-transform: uppercase;
    box-shadow:
      0 0 0 0.12rem rgba(255, 253, 240, 0.98),
      0 0 0 0.28rem rgba(9, 9, 11, 0.88),
      0 0.45rem 1rem rgba(9, 9, 11, 0.55);
    filter: contrast(1.08);
    pointer-events: none;
  }

  .postcard-stamp::before,
  .postcard-stamp::after {
    content: '';
    position: absolute;
    inset: 0.3rem;
    border: 0.09rem dashed currentColor;
    opacity: 0.72;
  }

  .postcard-stamp::after {
    inset: auto 8% 14%;
    height: 0.08rem;
    border: 0;
    background: currentColor;
    box-shadow:
      0.7rem -5.4rem 0 -0.02rem currentColor,
      -1.2rem -2.8rem 0 -0.04rem currentColor;
    opacity: 0.33;
  }

  .stamp-orbit {
    position: absolute;
    inset: 0.55rem;
    border: 0.08rem solid currentColor;
    opacity: 0.55;
  }

  .stamp-mark {
    z-index: 1;
    align-self: end;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 2.65rem;
    font-weight: 900;
    line-height: 0.95;
    letter-spacing: -0.15rem;
  }

  .stamp-title {
    z-index: 1;
    max-width: 100%;
    padding: 0.16rem 0.28rem;
    border-top: 0.12rem solid currentColor;
    border-bottom: 0.12rem solid currentColor;
    font-size: 0.8rem;
    font-weight: 950;
    line-height: 1;
    letter-spacing: -0.035rem;
  }

  .stamp-motto {
    z-index: 1;
    max-width: 7.5rem;
    margin-top: 0.22rem;
    font-size: 0.43rem;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: 0.045rem;
  }

  .stamp-serial {
    position: absolute;
    z-index: 1;
    bottom: 0.2rem;
    right: 0.55rem;
    font-size: 0.34rem;
    font-weight: 900;
    letter-spacing: 0.06rem;
    opacity: 0.72;
  }

  .shape-round,
  .shape-round::before,
  .shape-round .stamp-orbit {
    border-radius: 999px;
  }

  .shape-oval {
    width: 10.2rem;
    height: 7.2rem;
    top: 1.3rem;
    border-radius: 50%;
  }

  .shape-oval::before,
  .shape-oval .stamp-orbit {
    border-radius: 50%;
  }

  .shape-oval .stamp-mark {
    font-size: 2rem;
  }

  .shape-square {
    width: 8.3rem;
    height: 8.3rem;
    border-radius: 0.15rem;
  }

  .shape-ticket {
    width: 11rem;
    height: 6.4rem;
    top: 1.4rem;
    border-radius: 0.4rem;
  }

  .shape-ticket .stamp-orbit {
    border-left-style: dashed;
    border-right-style: dashed;
  }

  .shape-ticket .stamp-mark {
    font-size: 1.9rem;
  }

  .shape-diamond {
    width: 7.8rem;
    height: 7.8rem;
    top: 1.1rem;
    right: 1.45rem;
    transform: rotate(calc(var(--stamp-rotation) + 45deg));
  }

  .shape-diamond > * {
    transform: rotate(-45deg);
  }

  .shape-diamond .stamp-orbit {
    transform: none;
  }

  .tone-luxe {
    border-style: double;
    border-width: 0.45rem;
    font-family: Georgia, 'Times New Roman', serif;
  }

  .tone-military {
    border-radius: 0;
    letter-spacing: 0.04rem;
    filter: contrast(1.2);
  }

  .tone-military::before {
    border-style: solid;
    border-width: 0.16rem;
  }

  .tone-clinical {
    border-width: 0.2rem;
  }

  .tone-clinical::before {
    border-style: dotted;
  }

  .tone-ominous {
    border-style: double;
    box-shadow: inset 0 0 0 0.16rem currentColor;
    filter: contrast(1.35) saturate(0.75);
  }

  .tone-ominous .stamp-mark {
    text-shadow:
      0.12rem 0 currentColor,
      -0.08rem 0 currentColor;
  }

  .tone-playful {
    border-style: dotted;
  }

  .tone-playful .stamp-title {
    transform: rotate(-2deg);
    font-family: 'Trebuchet MS', ui-sans-serif, sans-serif;
  }

  .tone-gentle {
    border-width: 0.2rem;
    font-family: Georgia, 'Times New Roman', serif;
  }

  .tone-clandestine {
    border-style: dashed;
    filter: contrast(1.4);
    clip-path: polygon(1% 4%, 97% 0, 100% 94%, 4% 100%);
  }

  .stamp-tserriednich {
    border-width: 0.12rem;
  }

  .stamp-tserriednich::before,
  .stamp-tserriednich .stamp-orbit {
    border-style: solid;
  }

  .stamp-tyson::after {
    box-shadow:
      1rem -5.2rem 0 0 currentColor,
      -1rem -5.2rem 0 0 currentColor;
  }

  .stamp-woble {
    width: 6.6rem;
    height: 6.6rem;
    top: 1.65rem;
    right: 1.9rem;
  }

  .stamp-hisoka {
    border-top-color: #297fa3;
    border-bottom-color: #297fa3;
  }

  .stamp-heilLy {
    border-style: dotted dashed double;
  }

  .stamp-zoldyck {
    border-style: double;
  }

  @media (max-width: 640px) {
    .postcard-stamp {
      scale: 0.72;
      transform-origin: top right;
    }
  }
</style>
