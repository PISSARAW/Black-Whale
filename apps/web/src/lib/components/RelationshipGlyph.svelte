<script lang="ts">
  import MangaIcon from '$lib/components/icons/MangaIcon.svelte'

  let { glyph }: { glyph?: string } = $props()
</script>

<div class="relation-glyph" aria-hidden="true"><MangaIcon {glyph} /></div>

<style>
  .relation-glyph {
    display: grid;
    place-items: center;
    border-right: 0;
    color: var(--relation);
    font: 500 1.25rem/1 var(--font-mono);
  }
</style>
