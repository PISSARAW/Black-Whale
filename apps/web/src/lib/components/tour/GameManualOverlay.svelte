<script lang="ts">
  import { locale } from '$lib/i18n'
  import { onDestroy, onMount } from 'svelte'

  interface Control {
    keys: string[]
    description: string
    descriptionFr: string
  }

  interface Props {
    open: boolean
    title: string
    titleFr: string
    objective: string
    objectiveFr: string
    controls: Control[]
    onClose: () => void
  }

  let { open, title, titleFr, objective, objectiveFr, controls, onClose }: Props = $props()

  function handleKeydown(event: KeyboardEvent) {
    if (open && (event.key === 'Escape' || event.key === 'h' || event.key === 'H' || event.key === '?')) {
      onClose()
      event.preventDefault()
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeydown)
    }
  })
</script>

{#if open}
  <div
    class="pointer-events-auto absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-6 backdrop-blur-md"
    role="dialog"
    aria-modal="true"
    aria-labelledby="manual-title"
  >
    <div class="relative w-full max-w-2xl rounded-xl border border-white/15 bg-[#0a0f16]/90 p-8 shadow-2xl">
      <button
        class="absolute right-6 top-6 text-white/50 transition-colors hover:text-white"
        onclick={onClose}
        aria-label={$locale === 'fr' ? 'Fermer' : 'Close'}
      >
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <p class="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-500">
        {$locale === 'fr' ? 'Mode d\'emploi' : 'Instruction Manual'}
      </p>
      <h2 id="manual-title" class="mt-2 text-3xl font-black tracking-tight text-white">
        {$locale === 'fr' ? titleFr : title}
      </h2>

      <div class="mt-6 border-l-2 border-cyan-500/50 pl-4">
        <h3 class="text-xs font-bold uppercase tracking-widest text-white/70">
          {$locale === 'fr' ? 'Objectif' : 'Objective'}
        </h3>
        <p class="mt-2 text-sm leading-relaxed text-sky-100/90">
          {$locale === 'fr' ? objectiveFr : objective}
        </p>
      </div>

      <div class="mt-8">
        <h3 class="mb-4 text-xs font-bold uppercase tracking-widest text-white/70">
          {$locale === 'fr' ? 'Commandes' : 'Controls'}
        </h3>
        <ul class="grid gap-3 sm:grid-cols-2">
          {#each controls as control (control.description)}
            <li class="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-3">
              <div class="flex shrink-0 gap-1">
                {#each control.keys as key (key)}
                  <kbd class="min-w-[1.5rem] rounded border border-white/20 bg-black/50 px-1.5 py-0.5 text-center font-mono text-[10px] font-bold text-white shadow-inner">{key}</kbd>
                {/each}
              </div>
              <span class="text-xs leading-snug text-white/80">
                {$locale === 'fr' ? control.descriptionFr : control.description}
              </span>
            </li>
          {/each}
        </ul>
      </div>

      <div class="mt-10 flex justify-center">
        <button
          onclick={onClose}
          class="rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-8 py-3 text-sm font-bold uppercase tracking-widest text-cyan-300 transition-all hover:border-cyan-400 hover:bg-cyan-900/60"
        >
          {$locale === 'fr' ? 'Reprendre la partie' : 'Resume game'}
        </button>
      </div>
    </div>
  </div>
{/if}
