<script lang="ts">
  /**
   * Finding a room in the ship by typing its name.
   *
   * The index in the column shows one level at a time, alphabetically, in about
   * two hundred pixels: that is fifty-three entries on the first deck alone, and
   * the thirty-four interiors are not in it at all, so the kitchen of apartment
   * 1004 is unreachable unless you already know it is behind a door on tier 1.
   * This searches all three hundred and one spaces and all thirty-four interiors
   * at once, which is the only way a ship this size is navigable by name.
   *
   * On the walk, ⌘K finds a room rather than opening the site's own palette. The
   * shortcut is claimed in the capture phase so the layout's handler never sees
   * it — one key, one meaning, decided by where you are standing.
   *
   * When nothing carries the words typed and they read as a question, the
   * server's language model is asked what kind of room is meant
   * (`lib/tour/looseSearch.ts`). It may not answer; the list then stays empty.
   */
  import { onMount, tick } from 'svelte'
  import type { Ship } from '$lib/tour/blueprint'
  import { findByKeywords } from '$lib/tour/looseSearch'
  import { LooseSearch } from '$lib/tour/pageLooseSearch.svelte'
  import { findPlaces, type Naming } from '$lib/tour/search'
  import type { Provenance } from '$lib/tour/types'

  interface Props {
    ship: Ship
    open?: boolean
    /** How places are named, in the language being read. */
    words: Naming
    /** The language the question is asked in, for the server's interpreter. */
    locale: string
    labels: {
      title: string
      placeholder: string
      /** "Showing 40 of 112" — a cap that says so is not a silent truncation. */
      showing: (shown: number, total: number) => string
      noMatch: string
      /** Shown while the question is being interpreted. */
      asking: string
      /** "Understood as: kitchen, prince" — what the list below was found by. */
      understood: (keywords: string) => string
      /** What Enter does: walk there, or aim the technique at it. */
      action: string
      level: string
      close: string
      hint: string
    }
    provenanceLabel: (provenance: Provenance) => string
    provenanceClass: (provenance: Provenance) => string
    onPick: (spaceId: string) => void
  }

  let {
    ship,
    open = $bindable(false),
    words,
    locale,
    labels,
    provenanceLabel,
    provenanceClass,
    onPick,
  }: Props = $props()

  const LIMIT = 40

  let query = $state('')
  let cursor = $state(0)
  let input = $state<HTMLInputElement | null>(null)
  let dialog = $state<HTMLDialogElement | null>(null)

  const found = $derived(findPlaces(ship, words, { text: query, limit: LIMIT }))

  const loose = new LooseSearch()
  const guessed = $derived(findByKeywords(ship, words, { keywords: loose.keywords, limit: LIMIT }))
  /** The name search when it found something; the interpreted one otherwise. */
  const rows = $derived(found.total ? found.shown : guessed.shown)
  const status = $derived.by(() => {
    if (found.total) return labels.showing(found.shown.length, found.total)
    if (loose.pending) return labels.asking
    if (guessed.total) return labels.understood(loose.keywords.join(', '))
    return labels.noMatch
  })

  $effect(() => {
    if (open && !found.total) loose.ask(query, locale)
    else loose.clear()
  })

  /** A new query is a new list; the highlight cannot stay on its ninth row. */
  const retype = () => {
    cursor = 0
  }

  $effect(() => {
    if (!dialog) return
    if (open && !dialog.open) {
      document.exitPointerLock?.()
      dialog.showModal()
      // Selected rather than cleared: reopening the finder on the search you
      // just ran is useful, and the first keystroke replaces it either way.
      void tick().then(() => {
        input?.focus()
        input?.select()
      })
    } else if (!open && dialog.open) {
      dialog.close()
    }
  })

  function pick(spaceId: string) {
    open = false
    onPick(spaceId)
  }

  function onInputKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!rows.length) return
      const step = event.key === 'ArrowDown' ? 1 : -1
      cursor = (cursor + step + rows.length) % rows.length
      return
    }
    if (event.key === 'Enter' && rows[cursor]) {
      event.preventDefault()
      pick(rows[cursor].spaceId)
    }
  }

  onMount(() => {
    /**
     * The capture phase, so the shortcut is settled before the site palette's
     * own window listener runs. Nothing else is swallowed: every other key falls
     * straight through to the walk.
     */
    const claim = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return
      event.preventDefault()
      event.stopPropagation()
      open = !open
    }
    window.addEventListener('keydown', claim, true)
    return () => window.removeEventListener('keydown', claim, true)
  })
</script>

<dialog
  data-hatsu-pass
  bind:this={dialog}
  aria-label={labels.title}
  onclose={() => (open = false)}
  onclick={(event) => {
    if (event.target === dialog) open = false
  }}
  class="mx-auto mb-auto mt-[12vh] w-[94vw] max-w-2xl rounded-lg border border-[#333] bg-[#0b0b0b] p-0 text-[#FFFFF0] backdrop:bg-[#050505]/80 backdrop:backdrop-blur-sm"
>
  <div class="flex items-center gap-2 border-b border-[#333] px-3 py-2.5">
    <span aria-hidden="true" class="text-[#FFD700]">⌕</span>
    <input
      bind:this={input}
      bind:value={query}
      oninput={retype}
      onkeydown={onInputKeydown}
      type="text"
      autocomplete="off"
      aria-label={labels.title}
      placeholder={labels.placeholder}
      class="min-w-0 flex-1 bg-transparent text-sm text-[#FFFFF0] placeholder:text-[#FFFFF0]/30 focus:outline-none"
    />
    <button
      type="button"
      onclick={() => (open = false)}
      class="rounded border border-[#333] px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-[#FFFFF0]/50 hover:border-[#FFD700]/50 hover:text-[#FFFFF0]"
    >
      {labels.close}
    </button>
  </div>

  <p class="px-3 py-1.5 text-[10px] uppercase tracking-widest text-[#FFFFF0]/40" aria-live="polite">
    {status}
  </p>

  <ul class="max-h-[52vh] overflow-y-auto border-t border-[#222]">
    {#each rows as place, index (place.id)}
      <li>
        <button
          type="button"
          onclick={() => pick(place.spaceId)}
          onmouseenter={() => (cursor = index)}
          aria-label="{labels.action} — {place.label}"
          class="flex w-full items-baseline gap-2 px-3 py-2 text-left text-xs {index === cursor
            ? 'bg-[#FFD700]/12 text-[#FFFFF0]'
            : 'text-[#FFFFF0]/80'}"
        >
          <span class="flex-1 truncate font-medium">
            {place.label}
            {#if place.kind === 'level'}
              <span class="ml-1 text-[9px] uppercase tracking-wider text-[#FFD700]/70">
                {labels.level}
              </span>
            {/if}
          </span>
          <span class="shrink-0 truncate text-[10px] text-[#FFFFF0]/45">{place.place}</span>
          <span
            class="shrink-0 rounded border px-1 py-px text-[9px] uppercase {provenanceClass(
              place.provenance,
            )}"
          >
            {provenanceLabel(place.provenance)}
          </span>
        </button>
      </li>
    {/each}
  </ul>

  <p class="border-t border-[#222] px-3 py-1.5 text-[10px] text-[#FFFFF0]/40">{labels.hint}</p>
</dialog>
