<script lang="ts">
  import '$lib/components/game/mode-hud.css'
  import type { TutorialStep } from '$lib/hunt/tutorial'

  interface Props {
    step: Exclude<TutorialStep, 'done'>
    labels: {
      title: string
      step: Record<Exclude<TutorialStep, 'done'>, { title: string; body: string }>
      dismiss: string
    }
    onDismiss: () => void
  }

  let { step, labels, onDismiss }: Props = $props()
</script>

<aside class="mode-hud mode-hud-surface p-3" data-tone="gold" aria-live="polite">
  <div class="flex items-start justify-between gap-4">
    <div>
      <p class="mode-hud-label">{labels.title}</p>
      <h2 class="mt-1 text-sm font-medium text-white">{labels.step[step].title}</h2>
      <p class="mt-1 text-xs leading-relaxed text-slate-300">{labels.step[step].body}</p>
    </div>
    <button
      class="mode-hud-button pointer-events-auto shrink-0"
      type="button"
      onclick={onDismiss}
      aria-label={labels.dismiss}>×</button
    >
  </div>
</aside>
