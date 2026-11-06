<script lang="ts">
  import { iconForGlyph, mangaIcons, type MangaIconName } from './mangaIcons'

  let {
    name = 'aura',
    glyph,
    size = '1em',
    label,
  }: {
    name?: MangaIconName
    glyph?: string
    size?: string | number
    label?: string
  } = $props()

  const resolvedName = $derived(glyph === undefined ? name : iconForGlyph(glyph))
</script>

<svg
  class="manga-icon"
  data-icon={resolvedName}
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  width={size}
  height={size}
  fill="none"
  stroke="currentColor"
  stroke-width="1.7"
  stroke-linecap="round"
  stroke-linejoin="round"
  role={label ? 'img' : 'presentation'}
  aria-hidden={label ? undefined : 'true'}
  aria-label={label}
  focusable="false"
>
  <path d={mangaIcons[resolvedName]} />
</svg>

<style>
  .manga-icon {
    display: inline-block;
    flex-shrink: 0;
    vertical-align: -0.15em;
  }
</style>
