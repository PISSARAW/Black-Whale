<script lang="ts">
  import './mode-hud.css'

  let {
    label,
    shortcut,
    keyLabel = shortcut,
    primary = false,
    disabled = false,
    pressed,
    title,
    onclick,
  }: {
    label: string
    shortcut?: string
    keyLabel?: string
    primary?: boolean
    disabled?: boolean
    pressed?: boolean
    title?: string
    onclick: () => void
  } = $props()
</script>

<button
  type="button"
  class="mode-hud-button mode-command"
  data-primary={primary ? '' : undefined}
  aria-keyshortcuts={shortcut}
  aria-pressed={pressed}
  {title}
  {disabled}
  {onclick}
>
  {#if keyLabel}<kbd aria-hidden="true">{keyLabel}</kbd>{/if}
  <span>{label}</span>
</button>
